import '@interactrepair/list-option';
import '@interactrepair/select';

const select = document.querySelector('#target');
const oracle = document.querySelector('#oracle');

function renderStatus(label) {
  oracle.textContent = JSON.stringify(
    {
      label,
      value: select.value,
      displayValue: select.displayValue,
      selectedIndex: select.selectedIndex,
      open: select.open,
      filter: select.filter
    },
    null,
    2
  );
}

select.addEventListener('change', () => renderStatus('change'));
customElements.whenDefined('nimble-select').then(() => renderStatus('ready'));
