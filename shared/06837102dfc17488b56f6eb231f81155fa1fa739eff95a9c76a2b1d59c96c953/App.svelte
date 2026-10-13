<script>
  import { createDialog, createPopover, melt } from '$lib/index';
  const kind = new URLSearchParams(location.search).get('kind') || 'dialog';
  const builder = kind === 'dialog'
    ? createDialog({ closeOnOutsideClick: false, preventScroll: false })
    : createPopover({ closeOnOutsideClick: false });
  const { elements: { trigger, content }, states: { open } } = builder;
</script>

<main id="oracle-ready">
  <h1>Focus remains inside an open {kind}</h1>
  <button data-testid="before">Outside before</button>
  <button use:melt={$trigger} data-testid="trigger">Open {kind}</button>
  <button data-testid="outside">Outside click target</button>
  <div use:melt={$content} data-testid="content">
    <button data-testid="first">First inner action</button>
    <button data-testid="last">Last inner action</button>
  </div>
  <button data-testid="after">Outside after</button>
  <output data-testid="open-state">{$open ? 'open' : 'closed'}</output>
</main>

<style>
  :global(body) { margin: 40px; font-family: sans-serif; }
  button { padding: 12px; margin: 8px; }
  [data-testid="content"] { padding: 24px; background: #eee; border: 2px solid #333; }
</style>
