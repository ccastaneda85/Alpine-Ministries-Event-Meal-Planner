package com.event_meal_manager.application.vendor;

import com.event_meal_manager.application.purchasing.PurchaseListService;
import com.event_meal_manager.domain.purchasing.PurchaseListItem;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Sends a purchase list + uploaded vendor CSVs to Claude and writes back
 * vendor / vendor item # / vendor description suggestions on each matching
 * purchase list item.
 *
 * POC-grade: one call per analyze, direct HTTP, no caching yet. Validation
 * is minimal — we trust the model's tool output since the user can always
 * edit the fields afterwards.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VendorSuggestionService {

    private final PurchaseListService purchaseListService;
    private final VendorFileService vendorFileService;

    @Value("${anthropic.api-key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-sonnet-4-6}")
    private String model;

    private final ObjectMapper mapper = JsonMapper.builder().build();
    private final HttpClient http = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(20))
        .build();

    public record AnalyzeResult(int totalItems, int itemsUpdated, String modelResponse) {}

    public AnalyzeResult analyzeAndApply(Long purchaseListId) throws IOException, InterruptedException {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "ANTHROPIC_API_KEY is not configured. Set it as an environment variable and restart."
            );
        }

        List<PurchaseListItem> items = purchaseListService.findItemsByPurchaseListId(purchaseListId);
        if (items.isEmpty()) {
            return new AnalyzeResult(0, 0, "No items to analyze.");
        }

        List<VendorCsv> csvs = loadAllVendorCsvs();
        if (csvs.isEmpty()) {
            throw new IllegalStateException(
                "No vendor CSV files have been uploaded. Upload at least one on the Vendors page first."
            );
        }

        String requestBody = buildRequestBody(items, csvs);
        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create("https://api.anthropic.com/v1/messages"))
            .timeout(Duration.ofMinutes(2))
            .header("Content-Type", "application/json")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build();

        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() / 100 != 2) {
            log.error("Anthropic API error {}: {}", resp.statusCode(), resp.body());
            throw new IOException("Anthropic API returned " + resp.statusCode() + ": " + snippet(resp.body()));
        }

        List<Suggestion> suggestions = parseSuggestions(resp.body());
        int updated = applySuggestions(items, suggestions);
        return new AnalyzeResult(items.size(), updated, snippet(resp.body()));
    }

    private record VendorCsv(String vendor, String originalName, String content) {}

    private List<VendorCsv> loadAllVendorCsvs() throws IOException {
        List<VendorFileService.VendorFileInfo> files = vendorFileService.list();
        List<VendorCsv> out = new ArrayList<>();
        Path dir = Path.of("./vendor-files").toAbsolutePath().normalize();
        for (var info : files) {
            if (info.vendor() == null) continue; // skip legacy/no-vendor files
            Path p = dir.resolve(info.name()).normalize();
            if (!p.startsWith(dir)) continue;
            String content = Files.readString(p);
            out.add(new VendorCsv(info.vendor(), info.originalName(), content));
        }
        return out;
    }

    private String buildRequestBody(List<PurchaseListItem> items, List<VendorCsv> csvs) {
        // Build the user message content as multiple blocks so we can apply
        // prompt caching to the CSV bodies (they're the big, stable chunk).
        ArrayNode contentBlocks = mapper.createArrayNode();

        ObjectNode intro = mapper.createObjectNode();
        intro.put("type", "text");
        intro.put("text",
            "I have a kitchen purchase list and CSV catalogs from vendors. " +
            "For each purchase list item, pick the best-matching vendor + SKU from the catalogs. " +
            "Each item also includes the kitchen's needed quantity in a recipe unit (e.g. 12 lb). " +
            "Use the vendor's pack size / unit of measure to compute how many vendor units to actually order " +
            "(e.g. needed 12 lb of bacon, vendor sells in 6 lb cases → purchaseQuantity=2, purchaseUom=\"case\"). " +
            "Round up to the next whole vendor unit unless the vendor sells the same unit as the recipe. " +
            "If no reasonable match exists for an item, omit it from the suggestions array."
        );
        contentBlocks.add(intro);

        for (VendorCsv csv : csvs) {
            ObjectNode csvBlock = mapper.createObjectNode();
            csvBlock.put("type", "text");
            csvBlock.put("text",
                "VENDOR: " + csv.vendor() + "\n" +
                "FILE: " + csv.originalName() + "\n" +
                "CSV:\n" + csv.content()
            );
            // Cache the CSV contents so re-runs are cheap.
            ObjectNode cache = mapper.createObjectNode();
            cache.put("type", "ephemeral");
            csvBlock.set("cache_control", cache);
            contentBlocks.add(csvBlock);
        }

        ObjectNode itemsBlock = mapper.createObjectNode();
        StringBuilder itemsText = new StringBuilder("PURCHASE LIST ITEMS (JSON):\n[\n");
        for (int i = 0; i < items.size(); i++) {
            PurchaseListItem it = items.get(i);
            itemsText.append("  {")
                .append("\"purchaseListItemId\": ").append(it.getPurchaseListItemId()).append(", ")
                .append("\"name\": ").append(quote(it.getPurchaseListItemName())).append(", ")
                .append("\"quantity\": ").append(it.getQuantity()).append(", ")
                .append("\"uom\": ").append(quote(it.getUom()))
                .append("}");
            if (i < items.size() - 1) itemsText.append(",");
            itemsText.append("\n");
        }
        itemsText.append("]\n\nCall the submit_vendor_suggestions tool with your picks.");
        itemsBlock.put("type", "text");
        itemsBlock.put("text", itemsText.toString());
        contentBlocks.add(itemsBlock);

        // Root request
        ObjectNode root = mapper.createObjectNode();
        root.put("model", model);
        root.put("max_tokens", 4096);

        ArrayNode messages = mapper.createArrayNode();
        ObjectNode userMsg = mapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.set("content", contentBlocks);
        messages.add(userMsg);
        root.set("messages", messages);

        // Force structured output via a required tool call.
        ArrayNode tools = mapper.createArrayNode();
        ObjectNode tool = mapper.createObjectNode();
        tool.put("name", "submit_vendor_suggestions");
        tool.put("description", "Submit vendor/SKU matches for each purchase list item.");
        ObjectNode schema = mapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = mapper.createObjectNode();
        ObjectNode suggestionsProp = mapper.createObjectNode();
        suggestionsProp.put("type", "array");
        ObjectNode itemSchema = mapper.createObjectNode();
        itemSchema.put("type", "object");
        ObjectNode itemProps = mapper.createObjectNode();
        itemProps.set("purchaseListItemId", intType("The id of the purchase list item being matched."));
        itemProps.set("vendor", strType("Vendor name exactly as given in the CSV headers (e.g. Sysco)."));
        itemProps.set("vendorItemNumber", strType("The vendor's SKU / item number from the CSV."));
        itemProps.set("vendorItemDescription", strType("The vendor's own description of the item."));
        itemProps.set("purchaseQuantity", numType("How many vendor units to order to satisfy the needed kitchen qty (round up)."));
        itemProps.set("purchaseUom", strType("The vendor's UOM / pack — e.g. \"case\", \"each\", \"6lb case\"."));
        itemProps.set("confidence", enumType("Confidence this is the right match.", "high", "medium", "low"));
        itemProps.set("rationale", strType("Brief reason for the pick."));
        itemSchema.set("properties", itemProps);
        ArrayNode required = mapper.createArrayNode();
        required.add("purchaseListItemId");
        required.add("vendor");
        required.add("vendorItemNumber");
        itemSchema.set("required", required);
        suggestionsProp.set("items", itemSchema);
        props.set("suggestions", suggestionsProp);
        schema.set("properties", props);
        ArrayNode rootReq = mapper.createArrayNode();
        rootReq.add("suggestions");
        schema.set("required", rootReq);
        tool.set("input_schema", schema);
        tools.add(tool);
        root.set("tools", tools);

        ObjectNode toolChoice = mapper.createObjectNode();
        toolChoice.put("type", "tool");
        toolChoice.put("name", "submit_vendor_suggestions");
        root.set("tool_choice", toolChoice);

        return root.toString();
    }

    private ObjectNode intType(String desc) {
        ObjectNode n = mapper.createObjectNode();
        n.put("type", "integer");
        n.put("description", desc);
        return n;
    }

    private ObjectNode strType(String desc) {
        ObjectNode n = mapper.createObjectNode();
        n.put("type", "string");
        n.put("description", desc);
        return n;
    }

    private ObjectNode numType(String desc) {
        ObjectNode n = mapper.createObjectNode();
        n.put("type", "number");
        n.put("description", desc);
        return n;
    }

    private ObjectNode enumType(String desc, String... values) {
        ObjectNode n = mapper.createObjectNode();
        n.put("type", "string");
        n.put("description", desc);
        ArrayNode arr = mapper.createArrayNode();
        for (String v : values) arr.add(v);
        n.set("enum", arr);
        return n;
    }

    private record Suggestion(
        Long purchaseListItemId,
        String vendor,
        String vendorItemNumber,
        String vendorItemDescription,
        Float purchaseQuantity,
        String purchaseUom
    ) {}

    private List<Suggestion> parseSuggestions(String body) throws IOException {
        JsonNode root = mapper.readTree(body);
        JsonNode content = root.path("content");
        if (!content.isArray()) return List.of();
        for (JsonNode block : content) {
            if ("tool_use".equals(block.path("type").asText())
                && "submit_vendor_suggestions".equals(block.path("name").asText())) {
                JsonNode input = block.path("input");
                JsonNode arr = input.path("suggestions");
                if (!arr.isArray()) continue;
                List<Suggestion> out = new ArrayList<>();
                for (JsonNode s : arr) {
                    Long id = s.path("purchaseListItemId").isNumber() ? s.path("purchaseListItemId").asLong() : null;
                    if (id == null) continue;
                    out.add(new Suggestion(
                        id,
                        textOrNull(s, "vendor"),
                        textOrNull(s, "vendorItemNumber"),
                        textOrNull(s, "vendorItemDescription"),
                        floatOrNull(s, "purchaseQuantity"),
                        textOrNull(s, "purchaseUom")
                    ));
                }
                return out;
            }
        }
        return List.of();
    }

    private int applySuggestions(List<PurchaseListItem> items, List<Suggestion> suggestions) {
        int updated = 0;
        for (Suggestion s : suggestions) {
            PurchaseListItem target = items.stream()
                .filter(it -> Objects.equals(it.getPurchaseListItemId(), s.purchaseListItemId()))
                .findFirst()
                .orElse(null);
            if (target == null) continue;
            purchaseListService.updateItem(
                target.getPurchaseListItemId(),
                target.getPurchaseListItemName(),
                target.getQuantity(),
                target.getUom(),
                target.getNotes(),
                s.vendor(),
                s.vendorItemNumber(),
                s.vendorItemDescription(),
                target.getStatus(),
                target.getPurchaseOrderNumber(),
                s.purchaseQuantity(),
                s.purchaseUom()
            );
            updated++;
        }
        return updated;
    }

    private static String textOrNull(JsonNode n, String field) {
        JsonNode v = n.path(field);
        if (v.isMissingNode() || v.isNull()) return null;
        String s = v.asText();
        return s.isBlank() ? null : s;
    }

    private static Float floatOrNull(JsonNode n, String field) {
        JsonNode v = n.path(field);
        if (v.isMissingNode() || v.isNull() || !v.isNumber()) return null;
        return (float) v.asDouble();
    }

    private static String quote(String s) {
        if (s == null) return "null";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static String snippet(String body) {
        if (body == null) return "";
        return body.length() > 500 ? body.substring(0, 500) + "…" : body;
    }
}
