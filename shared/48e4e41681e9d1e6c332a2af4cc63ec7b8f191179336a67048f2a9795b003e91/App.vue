<script setup lang="ts">
import {
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from 'reka-ui'
</script>

<template>
  <main>
    <h1>Dialog focus with SelectTrigger</h1>
    <p>Open, close with Escape, and reopen the dialog.</p>
    <DialogRoot>
      <DialogTrigger data-testid="open-dialog">Open</DialogTrigger>
      <DialogContent data-testid="dialog">
        <DialogTitle>Test Dialog</DialogTitle>
        <label>Email <input data-testid="email-input" type="text" placeholder="you@example.com" /></label>
        <SelectRoot>
          <SelectTrigger data-testid="select-trigger"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </SelectRoot>
      </DialogContent>
    </DialogRoot>
  </main>
</template>
