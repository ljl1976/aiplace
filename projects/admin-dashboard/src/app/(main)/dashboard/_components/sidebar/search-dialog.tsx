"use client";
import * as React from "react";

import { ChartBar, Forklift, Gauge, GraduationCap, LayoutDashboard, Search, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const searchItems = [
  { group: "仪表板", icon: LayoutDashboard, label: "默认" },
  { group: "仪表板", icon: ChartBar, label: "客户关系" },
  { group: "仪表板", icon: Gauge, label: "分析" },
  { group: "仪表板", icon: ShoppingBag, label: "电子商务", disabled: true },
  { group: "仪表板", icon: GraduationCap, label: "学院", disabled: true },
  { group: "仪表板", icon: Forklift, label: "物流", disabled: true },
  { group: "认证", label: "登录 v1" },
  { group: "认证", label: "登录 v2" },
  { group: "认证", label: "注册 v1" },
  { group: "认证", label: "注册 v2" },
];

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const groups = [...new Set(searchItems.map((item) => item.group))];

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="link"
        className="px-0! font-normal text-muted-foreground hover:no-underline"
      >
        <Search data-icon="inline-start" />
        搜索
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="搜索仪表板、用户等…" />
          <CommandList>
            <CommandEmpty>未找到结果。</CommandEmpty>
            {groups.map((group, index) => (
              <React.Fragment key={group}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={group}>
                  {searchItems
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <CommandItem
                        disabled={item.disabled}
                        key={item.label}
                        onSelect={() => {
                          if (!item.disabled) {
                            setOpen(false);
                          }
                        }}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.label}</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
