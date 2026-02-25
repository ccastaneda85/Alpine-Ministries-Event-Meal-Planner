// Confirm delete actions
document.addEventListener('DOMContentLoaded', function() {
    // Add confirmation to delete forms
    document.querySelectorAll('form[data-confirm]').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            if (!confirm(form.dataset.confirm || 'Are you sure you want to delete this item?')) {
                e.preventDefault();
            }
        });
    });

    // Auto-hide alerts after 5 seconds
    document.querySelectorAll('.alert').forEach(function(alert) {
        setTimeout(function() {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.5s';
            setTimeout(function() {
                alert.remove();
            }, 500);
        }, 5000);
    });
});

// Ingredient autocomplete + quick-add modal
(function () {
    const searchInput = document.getElementById('ingredient-search');
    if (!searchInput) return;

    const hiddenInput = document.getElementById('ingredientId');
    const suggestionsBox = document.getElementById('ingredient-suggestions');
    const newBtn = document.getElementById('new-ingredient-btn');
    const modal = document.getElementById('ingredient-modal');
    const modalName = document.getElementById('modal-name');
    const modalUom = document.getElementById('modal-uom');
    const modalSave = document.getElementById('modal-save');
    const modalCancel = document.getElementById('modal-cancel');
    const modalError = document.getElementById('modal-error');

    let debounceTimer = null;

    function showSuggestions(items) {
        suggestionsBox.innerHTML = '';
        if (items.length === 0) {
            const hint = document.createElement('div');
            hint.className = 'suggestion-hint';
            hint.textContent = 'No results — use "+ New Ingredient" to add one';
            suggestionsBox.appendChild(hint);
        } else {
            items.forEach(function (ing) {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = ing.ingredientName + ' (' + ing.unitOfMeasure + ')';
                div.addEventListener('mousedown', function (e) {
                    e.preventDefault(); // prevent blur before click
                    searchInput.value = ing.ingredientName + ' (' + ing.unitOfMeasure + ')';
                    hiddenInput.value = ing.ingredientId;
                    hiddenInput.setCustomValidity('');
                    suggestionsBox.style.display = 'none';
                });
                suggestionsBox.appendChild(div);
            });
        }
        suggestionsBox.style.display = 'block';
    }

    searchInput.addEventListener('input', function () {
        const term = searchInput.value.trim();
        hiddenInput.value = '';
        clearTimeout(debounceTimer);
        if (term.length < 2) {
            suggestionsBox.style.display = 'none';
            return;
        }
        debounceTimer = setTimeout(function () {
            fetch('/api/ingredients/search?name=' + encodeURIComponent(term))
                .then(function (r) { return r.json(); })
                .then(showSuggestions)
                .catch(function () { suggestionsBox.style.display = 'none'; });
        }, 200);
    });

    searchInput.addEventListener('blur', function () {
        setTimeout(function () { suggestionsBox.style.display = 'none'; }, 150);
    });

    searchInput.addEventListener('focus', function () {
        if (searchInput.value.trim().length >= 2 && suggestionsBox.innerHTML) {
            suggestionsBox.style.display = 'block';
        }
    });

    // Validate hidden field on form submit
    searchInput.closest('form').addEventListener('submit', function (e) {
        if (!hiddenInput.value) {
            hiddenInput.setCustomValidity('Please select an ingredient from the list.');
            hiddenInput.reportValidity();
            e.preventDefault();
        } else {
            hiddenInput.setCustomValidity('');
        }
    });

    // Modal open
    newBtn.addEventListener('click', function () {
        modalName.value = searchInput.value.replace(/\s*\(.*\)\s*$/, '').trim();
        modalUom.value = '';
        modalError.style.display = 'none';
        modal.style.display = 'flex';
        modalName.focus();
    });

    // Modal close
    modalCancel.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });

    function closeModal() {
        modal.style.display = 'none';
        modalError.style.display = 'none';
    }

    // Modal save
    modalSave.addEventListener('click', function () {
        const name = modalName.value.trim();
        const uom = modalUom.value.trim();
        if (!name || !uom) {
            modalError.textContent = 'Both name and unit of measure are required.';
            modalError.style.display = 'block';
            return;
        }
        modalSave.disabled = true;
        fetch('/api/ingredients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredientName: name, unitOfMeasure: uom })
        })
        .then(function (r) {
            if (!r.ok) throw new Error('Failed to create ingredient');
            return r.json();
        })
        .then(function (ing) {
            closeModal();
            searchInput.value = ing.ingredientName + ' (' + ing.unitOfMeasure + ')';
            hiddenInput.value = ing.ingredientId;
            hiddenInput.setCustomValidity('');
            suggestionsBox.style.display = 'none';
        })
        .catch(function (err) {
            modalError.textContent = err.message || 'Could not save ingredient.';
            modalError.style.display = 'block';
        })
        .finally(function () { modalSave.disabled = false; });
    });
})();

// Format dates for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
