# User Workflow Studio 2.0

## Design System

All frontend UI work must use the **Transflo Design System** — a PrimeNG v21 + Angular v21 component library.

- **Local clone:** `transflo-design-system/` in the project root
- **GitHub:** https://github.com/jakesthekidd/transflo-design-system
- **Theme file:** `transflo-design-system/src/theme/transflo-theme.ts`

### Brand Colors
Primary palette is **blue** (`#2474BB` at 500). Surfaces use a **slate** scale. Also defined: cyan, green, red, orange.
Use CSS design tokens (e.g. `var(--p-primary-500)`) — never hardcode hex values.

### Available Components
| Category | Components |
|---|---|
| button | Button |
| forms | InputText, Select, MultiSelect, Checkbox, RadioButton, DatePicker, Textarea, ToggleSwitch, Password, AutoComplete, Slider, Rating, OTP, InputMask, InputNumber, IconField, ButtonGroup, SelectButton, ListBox, Knob |
| data-display | Table, Card, Tag, Badge, Chip, Avatar, Skeleton, Progress, MeterGroup, Timeline |
| navigation | Tabs, Breadcrumb, Menu, Menubar, Steps, Paginator, Toolbar, SpeedDial, SplitButton |
| overlay | Dialog, Drawer, Toast, Tooltip, Popover, Messages, ConfirmDialog, AuthResultBanner |
| layout | Accordion, Panel, ToggleButton |
| app-shell | HeaderToolbar, SideNav, StageLayout |
| command-center | CCInput, CCSelect |

### Rules
- Check this design system before building any UI component
- Note any customizations to PrimeNG defaults in comments or PR descriptions
- Stories live in `transflo-design-system/src/stories/`
