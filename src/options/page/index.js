const elements = {
  'labeled-checkbox': LabeledCheckboxElement,
  'select-one': SelectOneElement,
  'select-many': SelectManyElement,
  'hotkey-selector': HotkeySelectorElement,
};

const BackgroundPage = {
  _port: null,

  init: function() {
    BackgroundPage._port = browser.runtime.connect();
  },

  send: function(action, extras = {}) {
    return new Promise((resolve) => {
      const listener = (response) => {
        if (response.response === action) {
          BackgroundPage._port.onMessage.removeListener(listener);
          resolve(response);
        }
      };

      BackgroundPage._port.onMessage.addListener(listener);
      BackgroundPage._port.postMessage({action: action, ...JSON.parse(JSON.stringify(extras))});
    });
  },

  Opts: {
    get: async function() {
      return (await BackgroundPage.send('opts--get')).result;
    },

    set: async function(opts, extras = {}) {
      await BackgroundPage.send('opts--set', {opts, extras});
    },

    saveUsingBookmark: async function() {
      return (await BackgroundPage.send('opts--save-using-bookmark')).result;
    },
  },
};

function convertIDToOptChain(id) {
  return id.split('--').map(x => x.replace(/-./g, y => y[1].toUpperCase()));
}

function getAllCustomElements() {
  const retval = [];

  for (const key of Object.keys(elements)) {
    retval.push(...Array.from(document.getElementsByTagName(key)));
  }

  return retval.filter(x => ![
    'save-using-bookmark',
  ].includes(x.id));
}

async function load() {
  const opts = await BackgroundPage.Opts.get();

  document.getElementById('save-using-bookmark').value = await BackgroundPage.Opts.saveUsingBookmark();

  const elements = getAllCustomElements();
  for (const element of elements) {
    const chain = convertIDToOptChain(element.id);

    let value = opts;
    for (const link of chain) { value = value[link]; }

    element.value = value;
  }
}

async function save() {
  const opts = await BackgroundPage.Opts.get();
  const extras = {
    saveUsingBookmarkOverride: document.getElementById('save-using-bookmark').value,
  };

  const elements = getAllCustomElements();
  for (const element of elements) {
    const chain = convertIDToOptChain(element.id);
    const last = chain.pop();

    let value = opts;
    for (const link of chain) { value = value[link]; }
    value[last] = element.value;
  }

  await BackgroundPage.Opts.set(opts, extras);
}

window.addEventListener('DOMContentLoaded', async () => {
  BackgroundPage.init();

  for (const key of Object.keys(elements)) {
    customElements.define(key, elements[key]);
  }

  getAllCustomElements().forEach(x => x.addEventListener('change', save));

  await load();

  { // Sponsor types -> Sponsor auto-skip connection
    const sponsorTypes = document.getElementById('sponsors--types');
    const sponsorAutoskip = document.getElementById('sponsors--auto-skip');
    const func = () => {
      const value = sponsorTypes.value;
      const options = sponsorAutoskip.options;
      for (const opt of options) {
        sponsorAutoskip.disableOption(opt, !value.includes(opt));
      }
    };
    sponsorTypes.addEventListener('change', func);
    func();
  }

  { // Show sponsor segments -> Skip ads hotkey connection
    const showSponsorSegments = document.getElementById('sponsors--mark');
    const skipHotkey = document.getElementById('sponsors--skip-hotkey');

    const func = () => skipHotkey.disable(!showSponsorSegments.value);
    showSponsorSegments.addEventListener('change', func);
    func();
  }
});