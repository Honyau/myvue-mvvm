// Myvue的类
class Myvue {
  constructor(option) {
    this.$data = option.data();
    this.$el = option.el;
    // 调用observe方法，实现对数据的劫持
    observe(this.$data);
    // 调用compile方法，对html模板进行编译
    compile(this.$data, this.$el);
  }
}

function observe(data) {
  const keys = Object.keys(data);
  const dep = new Dep();

  //   劫持监测data中数据的setter，getter
  keys.forEach((key) => {
    let value = data[key];
    if (typeof data[key] === "object") observe(data[key]);
    Object.defineProperty(data, key, {
      get() {
        // 添加当前元素节点对应的Watcher订阅者
        Dep.target && dep.addSub(Dep.target)
        return value;
      },
      set(newval) {
        value = newval;
        // 发布通知
        dep.notify();
      },
    });
  });
}

// 对模板进行编译的方法
function compile(data, el) {
  // 获取#app下的所有元素
  const appTemplate = document.querySelector(el);
  const fragment = document.createDocumentFragment();
  while ((childNode = appTemplate.firstChild)) {
    fragment.appendChild(childNode);
  }

  // 此处进行模板替换操作
  replace(data, fragment);

  appTemplate.appendChild(fragment);

  function replace(data, frag) {
    // 匹配差值表达式中的变量
    const regex = /\{\{\s*(\S+)\s*\}\}/;

    Array.from(frag.children).forEach((ele) => {
      // 输入框
      if (ele.nodeType === 1 && ele.nodeName === "INPUT") {
        const attrs = Array.from(ele.attributes);
        const attrsVal = attrs.find((x) => x.name == "v-model");

        // 实例化Watcher
        new Watcher(
          (newVal) => {
            ele.value = newVal;
          },
          data,
          attrsVal.value
        );

        let value = attrsVal.value.split(".").reduce((newObj, key) => {
          return (newObj = newObj[key]);
        }, data);
        ele.value = value;

        // 监听输入事件，通过用户输入的值，来触发setter
        ele.addEventListener("input", (e) => {
          const attrsArr = attrsVal.value.split(".");
          const res = attrsArr
            .slice(0, attrsArr.length - 1)
            .reduce((newObj, k) => {
              return (newObj = newObj[k]);
            }, data);
          //对(嵌套)对象的目标属性进行赋值，触发setter
          res[attrsArr[attrsArr.length - 1]] = e.target.value;
        });
      }

      //   插值表达式内容
      if (regex.exec(ele.innerText) == null) return;
      const regexResStr = regex.exec(ele.innerText)[1];
      const text = ele.innerText;

      // 实例化Watcher
      new Watcher(
        (newVal) => {
          ele.innerText = text.replace(regex, newVal);
        },
        data,
        regexResStr
      );
      // 初始化时，首次替换变量
      const value = regexResStr.split(".").reduce((newObj, k) => {
        return (newObj = newObj[k]);
      }, data);
      ele.innerText = text.replace(regex, value);
    });
  }
}

class Dep {
  constructor() {
    this.subs = [];
  }

  addSub(watcher) {
    this.subs.push(watcher);
  }

  notify() {
    this.subs.forEach((watcher) => {
      watcher.update();
    });
  }
}

class Watcher {
  constructor(cb, data, str) {
    this.cb = cb;
    this.data = data;
    this.str = str;

    Dep.target = this;
    str.split(".").reduce((newObj, k) => (newObj = newObj[k]), data);
    Dep.target = null;
  }

  update() {
    const newVal = this.str
      .split(".")
      .reduce((newObj, k) => (newObj = newObj[k]), this.data);
    this.cb(newVal);
  }
}
