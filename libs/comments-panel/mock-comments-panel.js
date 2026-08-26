/**
 * <mock-comments-panel> v1.0.0 — a comment list + composer widget.
 *
 * Third-party library: integrate it through the contract documented in
 * README.md. The panel never fetches data itself — it renders exactly what
 * it is given and reports user actions as events.
 */

const STYLE_ID = 'mock-comments-panel-styles';

const CSS_TEXT = `
mock-comments-panel { display: flex; flex-direction: column; min-height: 0; overflow: hidden; background: #fff; border: 1px solid #dee2e6; border-radius: 8px; font-family: system-ui, sans-serif; }
mock-comments-panel .cmtp__header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid #e9ecef; }
mock-comments-panel .cmtp__title { flex: 1; margin: 0; overflow: hidden; font-size: 15px; font-weight: 650; color: #212529; text-overflow: ellipsis; white-space: nowrap; }
mock-comments-panel .cmtp__refresh { padding: 4px 8px; border: 0; border-radius: 4px; background: transparent; color: #495057; font-size: 17px; line-height: 1; cursor: pointer; }
mock-comments-panel .cmtp__refresh:hover { background: #f1f3f5; }
mock-comments-panel .cmtp__body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding: 12px 14px; }
mock-comments-panel .cmtp__empty { margin: auto; color: #868e96; font-size: 13.5px; text-align: center; }
mock-comments-panel .cmtp-item { display: flex; gap: 10px; }
mock-comments-panel .cmtp-item__avatar { flex: none; width: 34px; height: 34px; border-radius: 50%; background: #4c6ef5; color: #fff; font: 700 12px/34px system-ui, sans-serif; text-align: center; text-transform: uppercase; }
mock-comments-panel .cmtp-item__main { min-width: 0; }
mock-comments-panel .cmtp-item__meta { font-size: 12.5px; color: #868e96; }
mock-comments-panel .cmtp-item__meta strong { margin-right: 4px; color: #343a40; font-size: 13px; }
mock-comments-panel .cmtp-item__body { margin: 2px 0 3px; color: #212529; font-size: 13.5px; line-height: 1.45; overflow-wrap: anywhere; }
mock-comments-panel .cmtp-item__likes { color: #e64980; font-size: 12px; }
mock-comments-panel .cmtp__composer { display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px; border-top: 1px solid #e9ecef; background: #f8f9fa; }
mock-comments-panel .cmtp__input { flex: 1; min-height: 38px; max-height: 110px; padding: 8px 10px; border: 1px solid #ced4da; border-radius: 6px; resize: none; font: 13.5px/1.4 system-ui, sans-serif; }
mock-comments-panel .cmtp__send { padding: 9px 14px; border: 0; border-radius: 6px; background: #2f6fed; color: #fff; font: 600 13px system-ui, sans-serif; cursor: pointer; }
mock-comments-panel .cmtp__send:hover { background: #1c5cd8; }
mock-comments-panel .cmtp-skeleton { display: flex; gap: 10px; }
mock-comments-panel .cmtp-skeleton__avatar { flex: none; width: 34px; height: 34px; border-radius: 50%; }
mock-comments-panel .cmtp-skeleton__lines { flex: 1; display: flex; flex-direction: column; gap: 6px; padding-top: 3px; }
mock-comments-panel .cmtp-skeleton__line { height: 11px; border-radius: 4px; }
mock-comments-panel .cmtp-skeleton__line--short { width: 40%; }
mock-comments-panel .cmtp-shimmer { background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 45%, #e9ecef 65%); background-size: 200% 100%; animation: cmtp-shimmer 1.2s infinite linear; }
@keyframes cmtp-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
`;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS_TEXT;
  document.head.appendChild(style);
}

const UPGRADABLE_PROPS = ['comments', 'panelConfig', 'loading'];

class MockCommentsPanel extends HTMLElement {
  #comments = [];
  #panelConfig = {};
  #loading = false;
  #draft = '';

  // --- public contract (see README.md) ------------------------------------

  get comments() {
    return this.#comments;
  }

  set comments(value) {
    this.#comments = Array.isArray(value) ? value : [];
    this.#render();
  }

  get panelConfig() {
    return this.#panelConfig;
  }

  set panelConfig(value) {
    this.#panelConfig = value && typeof value === 'object' ? value : {};
    this.#render();
  }

  get loading() {
    return this.#loading;
  }

  set loading(value) {
    this.#loading = Boolean(value);
    this.#render();
  }

  // --- lifecycle -----------------------------------------------------------

  connectedCallback() {
    injectStyles();
    // Absorb properties assigned before this element was upgraded.
    for (const prop of UPGRADABLE_PROPS) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = this[prop];
        delete this[prop];
        this[prop] = value;
      }
    }
    // Delegated listeners survive the full re-renders below.
    this.addEventListener('click', this.#onClick);
    this.addEventListener('input', this.#onInput);
    this.addEventListener('keydown', this.#onKeydown);
    this.#render();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('input', this.#onInput);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  // --- events --------------------------------------------------------------

  #onClick = (event) => {
    if (event.target.closest('.cmtp__send')) {
      this.#submit();
    } else if (event.target.closest('.cmtp__refresh')) {
      this.#emit('panel-refresh', {});
    }
  };

  #onInput = (event) => {
    const input = event.target.closest('.cmtp__input');
    if (input) this.#draft = input.value;
  };

  #onKeydown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && event.target.closest('.cmtp__input')) {
      event.preventDefault();
      this.#submit();
    }
  };

  #submit() {
    const body = this.#draft.trim();
    if (!body) return;

    this.#draft = '';
    const input = this.querySelector('.cmtp__input');
    if (input) input.value = '';

    this.#emit('panel-submit', { body });
  }

  #emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  // --- rendering -----------------------------------------------------------

  #render() {
    if (!this.isConnected) return;

    const header = document.createElement('header');
    header.className = 'cmtp__header';
    const title = document.createElement('h3');
    title.className = 'cmtp__title';
    title.textContent = this.#panelConfig.title ?? 'Comments';
    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.className = 'cmtp__refresh';
    refresh.title = 'Refresh';
    refresh.setAttribute('aria-label', 'Refresh');
    refresh.textContent = '⟳';
    header.append(title, refresh);

    const body = document.createElement('div');
    body.className = 'cmtp__body';

    if (this.#loading) {
      for (let i = 0; i < 3; i += 1) body.appendChild(this.#createSkeletonRow());
    } else if (!this.#comments.length) {
      const empty = document.createElement('p');
      empty.className = 'cmtp__empty';
      empty.textContent = 'No comments yet.';
      body.appendChild(empty);
    } else {
      for (const comment of this.#comments) body.appendChild(this.#createCommentItem(comment));
    }

    this.replaceChildren(header, body);

    if (!this.#panelConfig.readOnly) {
      const composer = document.createElement('footer');
      composer.className = 'cmtp__composer';
      const input = document.createElement('textarea');
      input.className = 'cmtp__input';
      input.placeholder = 'Write a comment…';
      input.rows = 1;
      input.value = this.#draft;
      const send = document.createElement('button');
      send.type = 'button';
      send.className = 'cmtp__send';
      send.textContent = 'Send';
      composer.append(input, send);
      this.appendChild(composer);
    }
  }

  #createCommentItem(comment) {
    const item = document.createElement('article');
    item.className = 'cmtp-item';

    const user = comment?.user ?? {};
    const displayName = user.fullName || user.username || 'Anonymous';

    const avatar = document.createElement('span');
    avatar.className = 'cmtp-item__avatar';
    avatar.textContent = displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('');

    const main = document.createElement('div');
    main.className = 'cmtp-item__main';

    const meta = document.createElement('div');
    meta.className = 'cmtp-item__meta';
    const name = document.createElement('strong');
    name.textContent = displayName;
    meta.appendChild(name);
    if (user.username) meta.append(`@${user.username}`);

    const text = document.createElement('p');
    text.className = 'cmtp-item__body';
    text.textContent = comment?.body ?? '';

    main.append(meta, text);

    if (typeof comment?.likes === 'number') {
      const likes = document.createElement('span');
      likes.className = 'cmtp-item__likes';
      likes.textContent = `♥ ${comment.likes}`;
      main.appendChild(likes);
    }

    item.append(avatar, main);
    return item;
  }

  #createSkeletonRow() {
    const row = document.createElement('div');
    row.className = 'cmtp-skeleton';
    const avatar = document.createElement('span');
    avatar.className = 'cmtp-skeleton__avatar cmtp-shimmer';
    const lines = document.createElement('div');
    lines.className = 'cmtp-skeleton__lines';
    ['', '', 'cmtp-skeleton__line--short'].forEach((modifier) => {
      const line = document.createElement('span');
      line.className = `cmtp-skeleton__line cmtp-shimmer ${modifier}`.trim();
      lines.appendChild(line);
    });
    row.append(avatar, lines);
    return row;
  }
}

if (!window.customElements.get('mock-comments-panel')) {
  window.customElements.define('mock-comments-panel', MockCommentsPanel);
}

export { MockCommentsPanel };
