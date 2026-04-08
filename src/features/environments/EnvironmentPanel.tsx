import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useTheme } from '../../theme/theme'

export function EnvironmentPanel() {
  const { colors } = useTheme()
  const environments = useWorkspaceStore((state) => state.workspace.environments)
  const addEnvironment = useWorkspaceStore((state) => state.addEnvironment)
  const setActiveEnvironment = useWorkspaceStore((state) => state.setActiveEnvironment)
  const upsertEnvironmentVariable = useWorkspaceStore((state) => state.upsertEnvironmentVariable)
  const removeEnvironment = useWorkspaceStore((state) => state.removeEnvironment)

  return (
    <section aria-label="Environments panel" className="space-y-3 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          Environments
        </h2>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          style={{ borderColor: colors.border, color: colors.textPrimary }}
          onClick={() => {
            const name = window.prompt('Environment name')?.trim()
            if (name) {
              addEnvironment(name)
            }
          }}
        >
          + Environment
        </button>
      </div>

      {environments.length === 0 ? (
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          No environments yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {environments.map((environment) => (
            <li key={environment.id} className="rounded border p-2" style={{ borderColor: colors.border }}>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-left text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                  onClick={() => setActiveEnvironment(environment.id)}
                >
                  {environment.name}
                  {environment.isActive ? ' (Active)' : ''}
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  style={{ borderColor: colors.border, color: colors.textPrimary }}
                  onClick={() => removeEnvironment(environment.id)}
                >
                  Delete
                </button>
              </div>

              <button
                type="button"
                className="mt-2 rounded border px-2 py-1 text-xs"
                style={{ borderColor: colors.border, color: colors.textPrimary }}
                onClick={() => {
                  const key = window.prompt('Variable key')?.trim()
                  if (!key) {
                    return
                  }
                  const value = window.prompt('Variable value') ?? ''
                  upsertEnvironmentVariable(environment.id, { key, value, enabled: true })
                }}
              >
                + Variable
              </button>

              {environment.variables.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs" style={{ color: colors.textSecondary }}>
                  {environment.variables.map((variable) => (
                    <li key={variable.key}>
                      {variable.key}: {variable.value}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
