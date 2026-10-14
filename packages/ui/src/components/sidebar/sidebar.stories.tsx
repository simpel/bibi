import type { Meta, StoryObj } from "@storybook/react-vite";
import { HomeIcon, SettingsIcon } from "lucide-react";
import { Sidebar, SidebarInset, SidebarTrigger } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "./sidebar-group";
import { SidebarContent, SidebarHeader } from "./sidebar-layout";
import { SidebarMenu, SidebarMenuItem } from "./sidebar-menu";
import { SidebarMenuButton } from "./sidebar-menu-button";

const meta = {
  title: "Components/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SidebarProvider className="min-h-96">
      <Sidebar collapsible="icon">
        <SidebarHeader>Okazi</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive tooltip="Home">
                    <HomeIcon />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Settings">
                    <SettingsIcon />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="p-2">
          <SidebarTrigger />
        </header>
      </SidebarInset>
    </SidebarProvider>
  ),
};
