import '../packages/web-components/es/components/combo-box/index.js';

document.getElementById('root').innerHTML = `
  <cds-combo-box id="issue-combobox" title-text="Fruit" label="Choose a fruit" value="option-1">
    <cds-combo-box-item value="option-1">Option 1</cds-combo-box-item>
    <cds-combo-box-item value="option-2">Option 2</cds-combo-box-item>
  </cds-combo-box>
  <p id="status">Selection is blocked with preventDefault().</p>
`;

document.getElementById('issue-combobox').addEventListener('cds-combo-box-beingselected', (event) => {
  event.preventDefault();
});
