<script setup>
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '/subject/packages/core/src/index.ts';
</script>

<template>
  <main style="font-family: sans-serif; padding: 80px">
    <span id="oracle-ready" />
    <NavigationMenuRoot disable-hover-trigger disable-pointer-leave-close>
      <NavigationMenuList style="display:flex;gap:8px;list-style:none">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div style="width:300px;padding:24px;background:white;border:1px solid #777">
              Navigation content
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#github">Github</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
      <NavigationMenuViewport style="margin-top:12px" />
    </NavigationMenuRoot>
  </main>
</template>
