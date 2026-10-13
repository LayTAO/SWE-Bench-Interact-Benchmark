<script setup lang="ts">
import { DialogClose, DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
</script>

<template>
  <main><div class="card">
    <h1>Dialog outside pointer control</h1>
    <p>Compare explicit false and true values without an overlay's separate scroll lock.</p>
    <div class="row">
      <DialogRoot>
        <DialogTrigger data-testid="open-false">Open false dialog</DialogTrigger>
        <DialogPortal><DialogContent class="dialog" :disable-outside-pointer-events="false" data-testid="dialog-false">
          <DialogTitle>Pointer lock disabled</DialogTitle><p>The body should remain interactive.</p><DialogClose data-testid="close-false">Close</DialogClose>
        </DialogContent></DialogPortal>
      </DialogRoot>
      <DialogRoot>
        <DialogTrigger data-testid="open-true">Open true dialog</DialogTrigger>
        <DialogPortal><DialogContent class="dialog" :disable-outside-pointer-events="true" data-testid="dialog-true">
          <DialogTitle>Pointer lock enabled</DialogTitle><p>The body should be locked.</p><DialogClose data-testid="close-true">Close</DialogClose>
        </DialogContent></DialogPortal>
      </DialogRoot>
    </div>
  </div></main>
</template>
