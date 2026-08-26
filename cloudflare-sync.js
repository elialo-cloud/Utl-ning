(() => {
  const KEY = "boden-v4";
  const originalSetItem = Storage.prototype.setItem;
  let ready = false;
  let queued = null;

  const sync = (value) => {
    queued = value;
    if (!ready) return;
    fetch("/api/state", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: value
    }).catch(() => {});
  };

  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && key === KEY) sync(value);
  };

  fetch("/api/state", { cache: "no-store" })
    .then(response => response.ok ? response.json() : Promise.reject(new Error("state unavailable")))
    .then(state => {
      originalSetItem.call(localStorage, KEY, JSON.stringify(state));
      ready = true;
      if (queued) sync(queued);
    })
    .catch(() => {
      ready = true;
    });
})();
