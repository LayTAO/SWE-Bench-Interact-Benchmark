import '@subject/packages/components/listbox/register.ts';
import '@subject/packages/components/select/register.ts';

const select = document.querySelector('#subject');

for (let index = 1; index <= 40; index += 1) {
  const option = document.createElement('sl-option');
  option.value = String(index);
  option.textContent = `Option ${String(index).padStart(2, '0')}`;
  select.append(option);
}

await customElements.whenDefined('sl-select');
await select.updateComplete;

const listbox = select.listbox ?? select.renderRoot.querySelector('sl-listbox');

document.querySelector('#modal').showModal();
window.__reproReady = true;
