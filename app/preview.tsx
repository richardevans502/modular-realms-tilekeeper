import { loadSeedCatalog } from '../src/catalog/loadSeedCatalog';
import { buildDemoLayout, LayoutPreviewScreen } from '../src/preview/LayoutPreviewScreen';

const catalog = loadSeedCatalog();
const demoLayout = buildDemoLayout(catalog);

export default function PreviewRoute() {
  return <LayoutPreviewScreen layout={demoLayout} catalog={catalog} />;
}
