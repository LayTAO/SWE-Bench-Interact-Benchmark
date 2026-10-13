import '../packages/web-components/es/components/combo-box/index.js';

document.getElementById('root').innerHTML = `
  <cds-combo-box title-text="Fruit" label="Choose a fruit">
    <cds-combo-box-item value="apple">Apple</cds-combo-box-item>
    <cds-combo-box-item value="banana">Banana</cds-combo-box-item>
  </cds-combo-box>
  <button id="after" type="button">Next focus target</button>
`;
