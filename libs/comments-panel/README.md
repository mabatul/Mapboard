# `<mock-comments-panel>` — v1.0.0

A Web Component that renders a comment list with a composer input. The panel **never fetches data itself** — it renders exactly what it is given, and reports user actions as events for the host to handle.

## Quick start

```html
<script type="module" src="./mock-comments-panel.js"></script>

<mock-comments-panel style="height: 400px"></mock-comments-panel>

<script type="module">
  const panel = document.querySelector('mock-comments-panel');

  panel.panelConfig = { title: 'Obelisco' };
  panel.comments = [
    { id: 1, body: 'Great spot!', likes: 4, user: { username: 'leahw', fullName: 'Leah Gutierrez' } },
  ];

  panel.addEventListener('panel-submit', (event) => {
    console.log('user wants to post:', event.detail.body);
    // Persist it, then assign the updated list back to panel.comments.
  });
</script>
```

## Properties

All of these are **JavaScript properties** assigned on the element instance. HTML attributes are **not** read — `<mock-comments-panel comments="...">` does nothing.

| Property | Type | Description |
|---|---|---|
| `comments` | `CommentItem[]` | The full list to render, in order. Assigning a **new array** re-renders. Mutating a previously assigned array has no effect. |
| `panelConfig` | `{ title?: string, readOnly?: boolean }` | `title` shows in the header (default `"Comments"`). `readOnly: true` hides the composer input. |
| `loading` | `boolean` | `true` shows a skeleton state instead of the list. |

```ts
CommentItem = {
  id: number | string,
  body: string,
  likes?: number,                                   // shown only when present
  user: { username: string, fullName?: string },
}
```

## Events

All events are `CustomEvent`s dispatched with `bubbles: true, composed: true`.

| Event | `detail` | Fired when |
|---|---|---|
| `panel-submit` | `{ body: string }` | The user presses Send (or Enter) in the composer |
| `panel-refresh` | `{}` | The user clicks the refresh icon in the header |

## Behavior notes

- **The panel does not add the comment itself** when the user submits — it only emits `panel-submit` and clears the input. Persisting the comment and assigning the updated `comments` array is the host's job.
- Enter sends; Shift+Enter inserts a newline.
- With an empty list (and `loading` false) the panel shows a *"No comments yet."* message.
- Unsent draft text in the composer survives re-renders (e.g. toggling `loading`).
- The panel is a block element that fills its container — give it (or its container) a height.
