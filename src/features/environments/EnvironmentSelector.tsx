import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useTheme } from '../../theme/theme'

export function EnvironmentSelector() {
  const { colors } = useTheme()
  const environments = useWorkspaceStore((state) => state.workspace.environments)
  const setActiveEnvironment = useWorkspaceStore((state) => state.setActiveEnvironment)

  const activeEnvironmentId = environments.find((environment) => environment.isActive)?.id ?? ''

  return (
    <label className="flex items-center gap-2 text-sm" style={{ color: colors.textPrimary }}>
      <span>Environment</span>
      <select
        aria-label="Active environment"
        value={activeEnvironmentId}
        onChange={(event) => {
          if (event.target.value) {
            setActiveEnvironment(event.target.value)
          }
        }}
        className="rounded-md border px-2 py-2 text-sm"
        style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
      >
        <option value="" disabled>
          Select environment
        </option>
        {environments.map((environment) => (
          <option key={environment.id} value={environment.id}>
            {environment.name}
          </option>
        ))}
      </select>
    </label>
  )
}
