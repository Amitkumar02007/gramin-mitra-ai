export default function QueryForm({
  value,
  onChange,
  onSubmit,
  loading,
  disabled,
}) {
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="query-form" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="question">
        Aapki kya madad karun?
      </label>
      <div className="textarea-wrap">
        <textarea
          id="question"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Apni fasal, kheti ya yojana ke baare mein poochhein..."
          rows={4}
          maxLength={2000}
          required
          disabled={loading}
        />
        <span className="character-count">{value.length}/2000</span>
      </div>
      <div className="form-footer">
        <p className="form-note">
          <span aria-hidden="true">✦</span> Seedha sawal poochhein — jawab
          Hinglish mein milega.
        </p>
        <button
          className="submit-button"
          type="submit"
          disabled={disabled || loading || !value.trim()}
        >
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Soch raha hai...
            </>
          ) : (
            <>
              Salah paayein <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
