import css from "./controls.css";
import h from "hyperscript";

const btn = function() {
  return h("button.bindery-btn", ...arguments);
}
const btnMain = function() {
  return h("button.bindery-btn.bindery-btn-main", ...arguments);
}
const toggle = function() {
  return h(".bindery-toggle", ...arguments, toggleSwitch);
}
const toggleSwitch = function() {
  return h(".bindery-switch", h(".bindery-switch-handle"));
}
const label = function() {
  return h(".bindery-label", ...arguments);
}

class Controls {
  constructor(opts) {
    this.holder = h("div.bindery-controls");
    document.body.appendChild(this.holder);

    this.binder = opts.binder;

    const start = () => {
      this.setState("working");
      this.binder.bind();
    };
    const done = () => {
      this.binder.cancel();
      this.setState("start");
    };
    const guides = () => {
      guidesToggle.classList.toggle("selected")
      opts.binder.viewer.toggleGuides();
    };
    const facing = () => {
      facingToggle.classList.toggle("selected")
      layoutControl.classList.toggle("not-facing")
      opts.binder.viewer.toggleDouble();
    };
    const print = () => {
      opts.binder.viewer.setGrid();
      window.print();
    }

    let printBtn      = btnMain({onclick: print}, "Print");
    let guidesToggle  = toggle({onclick: guides}, "Show Bounds");

    let facingToggle  = toggle({onclick: facing}, "Facing Pages");
    facingToggle.classList.add("selected");

    let doneBtn = "";
    if (!this.binder.runImmeditately) {
      doneBtn = btn({onclick: done}, "Done");
    }

    const input = {
      top:    h("input", { type: "number", value: this.binder.pageMargin.top }),
      inner:  h("input", { type: "number", value: this.binder.pageMargin.inner }),
      outer:  h("input", { type: "number", value: this.binder.pageMargin.outer }),
      bottom: h("input", { type: "number", value: this.binder.pageMargin.bottom }),
      width:  h("input", { type: "number", value: this.binder.pageSize.width }),
      height: h("input", { type: "number", value: this.binder.pageSize.height })
    }

    const sizeControl   = h(".bindery-val.bindery-size",
      h("div", "W", input.width),
      h("div", "H", input.height),
    );

    const marginPreview = h(".preview");
    const marginControl = h(".bindery-val.bindery-margin",
      h(".top", input.top),
      h(".inner", input.inner),
      h(".outer", input.outer),
      h(".bottom", input.bottom),
      marginPreview,
    );

    const layoutControl = h(".bindery-layout-control",
      sizeControl,
      marginControl
    );

    const paperSize = h(".bindery-toggle", "Paper Size", h("select",
      h("option", "8.5 x 11"),
      h("option", "8.5 x 14"),
      h("option", "11 x 17"),
      h("option", "A4"),
    ))

    const perSheet = h(".bindery-toggle", "Pages per Sheet", h("select",
      h("option", "1"),
      h("option", "2"),
    ))

    const updateBtn = btn({onclick: updateLayout}, "Rebuild Layout");
    const validCheck = h("div", {style: {
      "float": "right",
      "display": "none",
      "color": "#e2b200",
    }}, "⚠️ Too Small");

    let updateDelay
    const throttledUpdate = () => {
      clearTimeout(updateDelay)
      updateDelay = setTimeout(updateLayout, 700)
    }


    const setGrid = () => {
      gridMode.classList.add("selected");
      interactMode.classList.remove("selected");
      printMode.classList.remove("selected");

      opts.binder.viewer.setGrid()
    }
    const setInteractive = () => {
      gridMode.classList.remove("selected");
      interactMode.classList.add("selected");
      printMode.classList.remove("selected");

      opts.binder.viewer.setInteractive();
    }
    const setPrint = () => {
      gridMode.classList.remove("selected");
      interactMode.classList.remove("selected");
      printMode.classList.add("selected");

      opts.binder.viewer.setPrintPreview();
    }
    const gridMode = h(".bindery-viewmode.grid.selected", { onclick: setGrid }, h(".icon"), "Grid");
    const interactMode = h(".bindery-viewmode.interactive",  { onclick: setInteractive },  h(".icon"), "Bound");
    const printMode = h(".bindery-viewmode.print",  { onclick: setPrint }, h(".icon"), "Sheet");
    const viewSwitcher = h(".bindery-viewswitcher",
      gridMode, interactMode, printMode,
    );

    this.header = h("div", { style : {
      "padding": "20px",
      "font-size": "20px"
    }}, "24 Pages");

    const updateLayoutPreview = (newSize, newMargin) => {
      const BASE = 80;
      let ratio = newSize.width / newSize.height;
      ratio = Math.max(ratio, 0.6);
      ratio = Math.min(ratio, 1.8);

      let w, h;
      if (ratio > 2) {
        w = BASE * ratio;
        h = BASE;
      }
      else {
        w = BASE;
        h = BASE * 1 / ratio;
      }
      let t = (newMargin.top / newSize.height) * h;
      let b = (newMargin.bottom / newSize.height) * h;
      let o = (newMargin.outer / newSize.width) * w;
      let i =  (newMargin.inner / newSize.width) * w;

      sizeControl.style.width  = `${w}px`;
      sizeControl.style.height = `${h}px`;
      marginControl.style.width  = `${w}px`;
      marginControl.style.height = `${h}px`;

      marginPreview.style.top    = `${t}px`;
      marginPreview.style.bottom = `${b}px`;
      marginPreview.style.left   = `${i}px`;
      marginPreview.style.right  = `${o}px`;
    }
    updateLayoutPreview(this.binder.pageSize, this.binder.pageMargin);

    const updateLayout = () => {
      let newMargin = {
        top:    input.top.value,
        inner:  input.inner.value,
        outer:  input.outer.value,
        bottom: input.bottom.value,
      }
      let newSize = {
        height: input.height.value,
        width:  input.width.value
      }

      let needsUpdate = false
      for (let k in newMargin) {
        if (this.binder.pageMargin[k] !== newMargin[k]) { needsUpdate = true }
      }
      for (let k in newSize) {
        if (this.binder.pageSize[k] !== newSize[k]) { needsUpdate = true }
      }

      if (needsUpdate) {
        updateLayoutPreview(newSize, newMargin)

        this.binder.setSize(newSize)
        this.binder.setMargin(newMargin)
        let isValid = this.binder.isSizeValid()
        if (isValid) {
          validCheck.style.display = "none"
          this.binder.makeBook();
        }
        else {
          validCheck.style.display = "block"
        }
      }
    }

    for (let k in input) {
      input[k].addEventListener("change", throttledUpdate);
      input[k].addEventListener("keyup", throttledUpdate);
    }


    this.states = {
      // start: , btn({ onclick: start}, "Get Started"),
      working: h("div.bindery-status", "Binding..."),
      done: h("div", {},
        this.header,
        doneBtn,
        printBtn,

        label(validCheck, "Layout"),
        layoutControl,
        facingToggle,

        // guidesToggle,

        label("Print"),
        paperSize,
        perSheet,

        viewSwitcher,
      )
    }
    this.state = ""
    this.setState("start");
  }
  setState(newState) {
    this.holder.style.display = (newState == "start") ? "none" : "block";

    if (newState == "done") {
      this.header.innerText = `${this.binder.viewer.pages.length} Pages`;
    }

    if (newState !== this.state && this.states[newState]) {
      this.state = newState;
      this.holder.innerHTML = "";
      this.holder.appendChild(this.states[newState]);

    }
  }
}

export default Controls;
