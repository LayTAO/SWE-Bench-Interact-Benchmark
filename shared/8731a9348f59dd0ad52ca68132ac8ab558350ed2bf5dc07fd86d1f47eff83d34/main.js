import '../packages/web-components/es/components/multi-select/index.js';

document.getElementById('root').innerHTML = `
  <cds-multi-select id="issue-multiselect" open title-text="Items" label="Choose items" selection-feedback="top">
    <cds-multi-select-item value="zebra">Zebra</cds-multi-select-item>
    <cds-multi-select-item value="apple">Apple</cds-multi-select-item>
    <cds-multi-select-item value="mango">Mango</cds-multi-select-item>
    <cds-multi-select-item value="banana">Banana</cds-multi-select-item>
  </cds-multi-select>
`;
