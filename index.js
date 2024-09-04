import { ready } from 'https://lsong.org/scripts/dom.js';
import { range } from 'https://lsong.org/scripts/math.js';
import { shuffle } from 'https://lsong.org/scripts/array.js';
import { serialize } from 'https://lsong.org/scripts/form.js';
import { gyroscope } from 'https://lsong.org/scripts/motion.js';
import { h, render, useState, useEffect, useRef, useThrottle } from 'https://lsong.org/scripts/react/index.js?v1';

const loadData = async name => {
  const res = await fetch(`data/${name}.json`);
  const data = await res.json();
  return shuffle(data);
};

const Game = ({ config }) => {
  const { time, dict: dictName } = config;
  const [word, setWord] = useState('');
  const [n, setCount] = useState(0);
  const [o, setCorrect] = useState(0);
  const [t, setTime] = useState(time);
  const words = useRef();
  const intervalRef = useRef();
  const init = async () => {
    words.current = await loadData(dictName);
    setWord(words.current[0]);
    intervalRef.current = setInterval(() => {
      setTime(t => t - 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  };
  const next = useThrottle((isCorrect = false) => {
    const { current: arr } = words;
    if (!arr) return;
    const w = arr.pop();
    setWord(w);
    setCount(n => n + 1);
    if (isCorrect) setCorrect(o => o + 1);
  }, 1000);
  const handleSkip = () => next(false);
  const handleCorrect = () => next(true);
  useEffect(() => {
    init();
    const cancel = gyroscope.addListener('change', ({ x }) => {
      if (gyroscope.portrait) return
      if (range(x, -45, -30)) {
        handleSkip();
      }
      if (range(x, 45, 50)) {
        handleCorrect();
      }
    });
    return cancel;
  }, []);
  return h('div', { className: 'panel' }, [
    h('h2', { className: 'panel-header' }, [
      h('span', null, "你比我猜"),
      h('small', null, t),
      h('small', null, `${o}/${n}`),
    ]),
    h('div', { className: 'panel-body' }, [
      h('b', { className: "game-word" }, word),
    ]),
    h('div', { className: 'panel-footer button-group' }, [
      h('button', { className: 'button button-success', onClick: handleCorrect }, '正确'),
      h('button', { className: 'button button-danger', onClick: handleSkip }, '跳过'),
    ])
  ]);
};

const times = [
  { t: 60, name: '60s' },
  { t: 90, name: '90s', selected: true },
  { t: 120, name: '120s' },
];

const App = () => {
  const [config, setConfig] = useState(null);
  const handleSubmit = async e => {
    e.preventDefault();
    const conf = serialize(e.target);
    setConfig(conf);
    gyroscope.enable();
  };
  if (config) return h(Game, { config });
  return h('form', { className: 'panel', onSubmit: handleSubmit }, [
    h('h2', { className: 'panel-header' }, [
      h('span', null, "你比我猜"),
    ]),
    h('div', { className: 'panel-body' }, [
      h('div', null, [
        h('h3', null, "选择词库"),
        h('select', { name: 'dict' }, [
          h('option', { value: 'default' }, '默认词库'),
          h('option', { value: 'chengyu' }, '成语大全'),
          h('option', { value: 'richang' }, '日常词汇'),
          h('option', { value: 'wangluo' }, '网络热词'),
          h('option', { value: 'gequ' }, '歌曲词汇'),
        ]),
        h('h3', null, "选择游戏时间"),
        times.map(x => h('label', null, [
          h('input', { name: "time", type: 'radio', value: x.t, checked: x.selected }),
          x.name,
        ])),
      ])
    ]),
    h('div', { className: 'panel-footer' }, [
      h('button', { className: 'button button-success', type: 'submit' }, '开始'),
    ])
  ]);
};

ready(() => {
  const app = document.getElementById('app');
  render(h(App), app);
});
