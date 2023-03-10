const foobar = () => { }
const barfoo = () => { }

enum Bar { Baz };

const foo = (bar: Bar) => {
  switch (bar) {
    case Bar.Baz:
      foobar();
      barfoo();
      break;
  }
  { !foo ? null : 1 }
}

const callback = "callback";
const callbakc = "callbakc"
const callbakk = "callbak"
const asnyc = "awiat"
