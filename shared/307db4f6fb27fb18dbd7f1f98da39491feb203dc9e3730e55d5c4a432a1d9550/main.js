import '../packages/web-components/es/components/menu-button/index.js';
import '../packages/web-components/es/components/menu/index.js';

document.getElementById('root').innerHTML = `
  <cds-menu-button label="Actions">
    <cds-menu style="min-width: 240px; min-height: 96px; background: white">
      <cds-menu-item label="Edit">Edit</cds-menu-item>
      <cds-menu-item label="Delete">Delete</cds-menu-item>
    </cds-menu>
  </cds-menu-button>
  <div id="overlap">A nearby stacking-context element that should remain behind the open menu.</div>
  <button id="after" type="button">After menu</button>
`;
