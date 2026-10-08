import { useState, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../api/endpoints';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState, ErrorBanner, Spinner } from '../components/ui/Feedback';
import { FormField } from '../components/ui/FormField';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatCard } from '../components/ui/StatCard';
import { useCategories } from '../hooks/useCategories';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../hooks/useToast';
import type { Category } from '../types';
import { getErrorMessage } from '../utils/errors';

/** Curated modern vibrant palette */
export const COLOR_PRESETS = [
  '#059669', // Emerald
  '#2563EB', // Blue
  '#8B5CF6', // Purple
  '#EA580C', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#4F46E5', // Indigo
  '#10B981', // Mint
  '#D946EF', // Fuchsia
  '#E11D48', // Crimson
  '#475569', // Slate
];

const SUGGESTIONS = [
  { name: 'Food & Dining', color: '#059669' },
  { name: 'Groceries', color: '#10B981' },
  { name: 'Rent & Housing', color: '#4F46E5' },
  { name: 'Transportation', color: '#06B6D4' },
  { name: 'Shopping', color: '#EC4899' },
  { name: 'Entertainment', color: '#8B5CF6' },
  { name: 'Health & Medical', color: '#E11D48' },
  { name: 'Utilities & Bills', color: '#F59E0B' },
  { name: 'Travel & Vacations', color: '#2563EB' },
  { name: 'Investments', color: '#14B8A6' },
  { name: 'Subscriptions', color: '#D946EF' },
];

type Editor = { mode: 'create' } | { mode: 'edit'; category: Category } | null;

function CategoryForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Category;
  onSubmit: (v: { name: string; color: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? COLOR_PRESETS[0]);
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit({ name: name.trim(), color: color.toUpperCase() });
    } catch (err) {
      setFormError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const applySuggestion = (s: { name: string; color: string }) => {
    setName(s.name);
    setColor(s.color);
    setError(undefined);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {formError && <ErrorBanner message={formError} />}

      {/* Live Preview Card */}
      <div className="spending-group-preview">
        <span
          className="spending-group-card__avatar"
          style={{ background: `${color}20`, color }}
        >
          <Icon name="tag" size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text)' }}>
            {name.trim() || 'Spending Group Name'}
          </strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Live appearance preview
          </span>
        </div>
        <span
          className="chip"
          style={{ background: `${color}18`, color, fontWeight: 600, fontSize: '0.78rem' }}
        >
          <span className="dot" style={{ background: color }} />
          Preview
        </span>
      </div>

      <FormField label="Group Name" error={error}>
        <input
          type="text"
          maxLength={50}
          placeholder="e.g. Food & Groceries"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          autoFocus
        />
      </FormField>

      {/* Quick Suggestion Pills */}
      <div>
        <label className="field__label" style={{ marginBottom: 4, display: 'block' }}>
          Quick suggestions
        </label>
        <div className="suggestion-chips">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.name}
              type="button"
              className="suggestion-chip"
              onClick={() => applySuggestion(s)}
            >
              <span className="dot" style={{ background: s.color, marginRight: 4 }} />
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <fieldset className="swatches" style={{ marginTop: 12 }}>
        <legend style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
          Color Badge
        </legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`swatch${preset.toLowerCase() === color.toLowerCase() ? ' swatch--active' : ''}`}
              style={{ background: preset }}
              onClick={() => setColor(preset)}
              aria-label={`Use colour ${preset}`}
              aria-pressed={preset.toLowerCase() === color.toLowerCase()}
            />
          ))}
          <label className="swatch swatch--custom" title="Custom colour">
            <span className="sr-only">Custom colour</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
        </div>
      </fieldset>

      <div className="form-actions" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create Spending Group'}
        </button>
      </div>
    </form>
  );
}

export function CategoriesPage() {
  useDocumentTitle('Spending Groups');
  const { notify } = useToast();
  const { categories, loading, error, reload } = useCategories();
  const [editor, setEditor] = useState<Editor>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'most' | 'least' | 'az' | 'za'>('most');

  const handleSave = async (values: { name: string; color: string }) => {
    if (editor?.mode === 'edit') {
      await categoriesApi.update(editor.category.id, values);
      notify('Spending group updated');
    } else {
      await categoriesApi.create(values);
      notify('Spending group created');
    }
    setEditor(null);
    reload();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await categoriesApi.remove(toDelete.id);
      notify('Spending group removed');
      reload();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setToDelete(null);
    }
  };

  // Metrics calculation
  const totalExpensesLogged = useMemo(
    () => categories.reduce((sum, c) => sum + c.expenseCount, 0),
    [categories]
  );

  const topCategory = useMemo(() => {
    if (!categories.length) return null;
    return [...categories].sort((a, b) => b.expenseCount - a.expenseCount)[0];
  }, [categories]);

  const unusedCount = useMemo(
    () => categories.filter((c) => c.expenseCount === 0).length,
    [categories]
  );

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let result = categories.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    result = [...result].sort((a, b) => {
      if (sortBy === 'most') return b.expenseCount - a.expenseCount;
      if (sortBy === 'least') return a.expenseCount - b.expenseCount;
      if (sortBy === 'az') return a.name.localeCompare(b.name);
      if (sortBy === 'za') return b.name.localeCompare(a.name);
      return 0;
    });

    return result;
  }, [categories, searchQuery, sortBy]);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>Spending Groups</h1>
          <p className="page__subtitle">
            Classify transactions, establish financial boundaries, and uncover spending patterns.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setEditor({ mode: 'create' })}
        >
          <Icon name="plus" size={18} /> New Spending Group
        </button>
      </header>

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {/* Top Key Metrics Ribbon */}
      <section className="spending-groups-stats" aria-label="Spending Group Statistics">
        <StatCard
          compact
          featured
          icon="categories"
          label="Total Groups"
          value={String(categories.length)}
          hint={`${categories.length - unusedCount} actively utilized`}
        />
        <StatCard
          compact
          icon="receipt"
          label="Tracked Expenses"
          value={String(totalExpensesLogged)}
          hint="across all groups"
        />
        <StatCard
          compact
          icon="target"
          label="Top Spending Group"
          value={topCategory?.name ?? 'None'}
          hint={
            topCategory && topCategory.expenseCount > 0
              ? `${topCategory.expenseCount} logged transactions`
              : 'No transactions yet'
          }
        />
        <StatCard
          compact
          icon="shield"
          label="Unassigned Groups"
          value={String(unusedCount)}
          hint={unusedCount > 0 ? 'Ready for new entries' : 'All groups have transactions'}
        />
      </section>

      {/* Search and Sort Toolbar */}
      <div className="spending-groups-toolbar">
        <div className="spending-groups-search">
          <span className="spending-groups-search__icon">
            <Icon name="search" size={16} />
          </span>
          <input
            type="search"
            placeholder="Search spending groups…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="spending-groups-search__clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>

        <div className="spending-groups-toolbar__controls">
          <select
            className="spending-groups-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort spending groups"
          >
            <option value="most">Sort: Most Transactions</option>
            <option value="least">Sort: Fewest Transactions</option>
            <option value="az">Sort: Alphabetical (A–Z)</option>
            <option value="za">Sort: Alphabetical (Z–A)</option>
          </select>

          <span className="muted" style={{ fontSize: '0.85rem' }}>
            {filteredCategories.length} {filteredCategories.length === 1 ? 'group' : 'groups'}
          </span>
        </div>
      </div>

      {loading && !categories.length ? (
        <Spinner />
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching spending groups' : 'No spending groups found'}
          text={
            searchQuery
              ? `No groups match "${searchQuery}". Try a different keyword.`
              : 'Create your first spending group to begin organizing your finances.'
          }
          action={
            searchQuery ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setEditor({ mode: 'create' })}
              >
                <Icon name="plus" size={18} /> Create Spending Group
              </button>
            )
          }
        />
      ) : (
        <ul className="spending-groups-grid">
          {filteredCategories.map((c) => {
            const usagePercent =
              totalExpensesLogged > 0 ? (c.expenseCount / totalExpensesLogged) * 100 : 0;

            return (
              <li key={c.id} className="spending-group-card">
                {/* Colored Top Accent Stripe */}
                <div
                  className="spending-group-card__stripe"
                  style={{ background: c.color }}
                  aria-hidden="true"
                />

                <div className="spending-group-card__head">
                  <div
                    className="spending-group-card__avatar"
                    style={{ background: `${c.color}18`, color: c.color }}
                  >
                    <Icon name="tag" size={22} />
                  </div>

                  <div className="spending-group-card__identity">
                    <h2 className="spending-group-card__name" title={c.name}>
                      {c.name}
                    </h2>
                    <span
                      className="chip"
                      style={{
                        background: `${c.color}15`,
                        color: c.color,
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        padding: '2px 8px',
                      }}
                    >
                      <span className="dot" style={{ background: c.color }} />
                      {c.expenseCount}{' '}
                      {c.expenseCount === 1 ? 'transaction' : 'transactions'}
                    </span>
                  </div>

                  <div className="spending-group-card__actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setEditor({ mode: 'edit', category: c })}
                      aria-label={`Edit ${c.name}`}
                      title="Edit group"
                    >
                      <Icon name="edit" size={17} />
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button--danger"
                      onClick={() => setToDelete(c)}
                      disabled={c.expenseCount > 0}
                      title={
                        c.expenseCount > 0
                          ? 'Groups with logged transactions cannot be deleted'
                          : `Delete ${c.name}`
                      }
                      aria-label={`Delete ${c.name}`}
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </div>

                <div className="spending-group-card__body">
                  <div className="spending-group-card__meter">
                    <div className="spending-group-card__meter-label">
                      <span>Activity share</span>
                      <strong>{usagePercent.toFixed(1)}%</strong>
                    </div>
                    <ProgressBar
                      percent={usagePercent}
                      color={c.color}
                      label={`${c.name} activity share`}
                    />
                  </div>
                </div>

                <div className="spending-group-card__foot">
                  <Link
                    to={`/expenses?category=${c.id}`}
                    className="link"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    View transactions →
                  </Link>
                  <span className="muted" style={{ fontSize: '0.75rem' }}>
                    {c.color}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Create / Edit Modal Dialog */}
      <Modal
        open={editor !== null}
        title={editor?.mode === 'edit' ? 'Edit Spending Group' : 'New Spending Group'}
        onClose={() => setEditor(null)}
      >
        {editor && (
          <CategoryForm
            initial={editor.mode === 'edit' ? editor.category : undefined}
            onSubmit={handleSave}
            onCancel={() => setEditor(null)}
          />
        )}
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete spending group?"
        message={
          toDelete
            ? `Are you sure you want to delete "${toDelete.name}"? This action cannot be undone.`
            : ''
        }
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

