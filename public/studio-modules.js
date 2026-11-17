export const studioModules=[
["visual","Visual Editor","Layers, drag/drop, multi-select, grouping, duplicate, delete, visibility, lock, reorder, snapping and alignment."],
["precision","Precision Layout","Pixel dimensions, coordinates, spacing, presets and original-versus-edited comparison."],
["navigation","Navigation Studio","Tabs, dropdowns, mega menus, mobile navigation, icons, URLs and per-item settings."],
["animation","Animation Studio","Hover, click, scroll, parallax, sticky and page transitions with timing, delay and easing."],
["components","Component Library","Header, footer, cards, modal, accordion, carousel, forms, tables and floating widgets."],
["responsive","Responsive Studio","Desktop, tablet and mobile previews with custom breakpoints and per-device styles."],
["media","Media Studio","Image, SVG, icon, video, audio and font asset management with crop, resize and filters."],
["inspector","HTML/CSS/JS Inspector","DOM, attributes, classes, IDs, styles and event inspection; behavior read-only by default."],
["ai","AI Design Assistant","Indonesian instructions, target selection, proposed changes, preview and approval."],
["cms","Page & CMS Manager","Pages, dynamic content, collections, templates, search and filters."],
["seo","SEO & Accessibility","Metadata, sitemap, schema, alt text, keyboard navigation, ARIA and contrast."],
["performance","Performance Analyzer","Asset weight, loading, CSS/JS footprint and Core Web Vitals checks."],
["versions","Version Control","Autosave, snapshots, history, diff, restore, backup and rollback."],
["deploy","GitHub Deployment Manager","Branches, commits, pull requests, staging previews, approval, publish and recovery."],
["team","Project & Team Manager","Multiple projects, templates, roles, comments and activity history."]
].map(([id,name,description])=>({id,name,description}));
export const behaviorSafety=Object.freeze({preserveOriginalIds:true,preserveEventHandlers:true,preserveApiContracts:true,preserveWorkflow:true,defaultNewControlsInert:true,productionDeploymentRequiresApproval:true});
export const listModules=()=>studioModules.map(x=>({...x}));