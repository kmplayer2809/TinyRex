import { SectionCard } from './components/SectionCard'
import { LayoutShell } from './features/workspace/LayoutShell'

function App() {
  return (
    <LayoutShell>
      <SectionCard title="Workspace overview">
        <p className="text-sm">Workspace shell is ready.</p>
      </SectionCard>
    </LayoutShell>
  )
}

export default App
