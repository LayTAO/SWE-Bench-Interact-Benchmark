<script setup lang="ts">
import {
  DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <main><div class="card">
    <h1>Submenu hover highlighting</h1>
    <p>Open the menu, then move the pointer over “More tools”.</p>
    <DropdownMenuRoot>
      <DropdownMenuTrigger data-testid="trigger">Open menu</DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent class="menu" data-testid="menu">
          <DropdownMenuItem class="item">Profile</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger class="item" data-testid="sub-trigger">More tools</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent class="menu" data-testid="sub-content">
                <DropdownMenuItem class="item">Developer tools</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem class="item">Settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div></main>
</template>
