<script setup lang="ts">
import {
  DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <main><div class="card"><h1>Dropdown inside a Dialog</h1>
    <DialogRoot>
      <DialogTrigger data-testid="dialog-trigger">Open dialog</DialogTrigger>
      <DialogPortal>
        <DialogOverlay class="overlay" data-testid="dialog-overlay" />
        <DialogContent class="dialog" data-testid="dialog-content">
          <DialogTitle>Dialog with menu</DialogTitle>
          <DropdownMenuRoot>
            <DropdownMenuTrigger data-testid="menu-trigger">Open menu</DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent class="menu" data-testid="menu-content">
                <DropdownMenuItem class="item">Menu item</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div></main>
</template>
