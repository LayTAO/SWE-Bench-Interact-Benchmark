<script>
  import { createTooltip, melt } from '$lib/index';
  const { elements: { trigger, content } } = createTooltip({
    openDelay: 0, closeDelay: 0, closeOnPointerDown: false,
  });
</script>

<main id="oracle-ready">
  <h1>Tooltip scrolling</h1>
  <div id="scroll-area">
    <button use:melt={$trigger} data-testid="trigger">Hover for details</button>
    <div class="spacer">Scrollable content</div>
  </div>
  <div use:melt={$content} data-testid="tooltip">Details for the hovered item</div>
</main>

<style>
  :global(body) { margin: 40px; font-family: sans-serif; }
  #scroll-area { height: 260px; width: 420px; overflow-y: auto; border: 1px solid; }
  button { margin: 50px; padding: 12px; }
  .spacer { height: 1000px; padding: 20px; }
  [data-testid="tooltip"] { padding: 12px; background: #222; color: white; }
</style>
