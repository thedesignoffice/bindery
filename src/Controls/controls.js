import css from "./controls.css";
import h from "hyperscript";

const btn = function() {
  return h("button.bindery-btn", ...arguments);
}
const btnMini = function() {
  return h("button.bindery-btn.bindery-btn-mini", ...arguments);
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

    const done = () => {
      this.binder.cancel();
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
      opts.binder.viewer.setPrint();
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

    const orientation = h(".bindery-toggle", "Orientation", h("select",
      h("option", "Landscape"),
      h("option", "Portrait"),
    ))

    const validCheck = h("div", {style: {
      "display": "none",
      "color": "#e2b200",
    }}, "Too Small");
    const forceRefresh = btnMini({onclick: () => {
      inProgress.style.display = "block";
      forceRefresh.style.display = "none";
      setTimeout(() => {
        this.binder.makeBook(() => {
          inProgress.style.display = "none";
          forceRefresh.style.display = "block";
        }, 100);
      });
    }}, "Update");
    const inProgress = h("div", {style: {
      "display": "none",
    }}, "Updating...");

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

      opts.binder.viewer.setPrint();
    }
    const gridMode = h(".bindery-viewmode.grid.selected", { onclick: setGrid }, h(".icon"), "Grid");
    const interactMode = h(".bindery-viewmode.interactive",  { onclick: setInteractive },  h(".icon"), "Bound");
    const printMode = h(".bindery-viewmode.print",  { onclick: setPrint }, h(".icon"), "Sheet");
    const viewSwitcher = h(".bindery-viewswitcher",
      gridMode, interactMode, printMode,
    );

    const header = h("div", { style : {
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

    this.setInProgress = () => {
      validCheck.style.display = "none";
      inProgress.style.display = "block";
      forceRefresh.style.display = "none";
    }

    this.setDone = () => {
      header.innerText = `${this.binder.viewer.pages.length} Pages`;
      inProgress.style.display = "none";
      forceRefresh.style.display = "block";
      validCheck.style.display = "none";
    }

    this.setInvalid = () => {
      validCheck.style.display = "block";
      forceRefresh.style.display = "none";
      inProgress.style.display = "none";
    }

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
        updateLayoutPreview(newSize, newMargin);
        this.binder.setSize(newSize);
        this.binder.setMargin(newMargin);

        if (this.binder.isSizeValid()) {
          this.binder.makeBook();
        }
        else {
          this.setInvalid();
        }
      }
    }

    for (let k in input) {
      input[k].addEventListener("change", throttledUpdate);
      input[k].addEventListener("keyup", throttledUpdate);
    }

    const layoutState = h("div",
      {style: {"float": "right"}},
      forceRefresh,
      validCheck,
      inProgress,
    )

    this.holder.appendChild(h("div", {},
        header,
        doneBtn,
        printBtn,

        label(layoutState, "Pagination"),
        layoutControl,
        facingToggle,
        guidesToggle,

        label("Print"),
        paperSize,
        perSheet,
        orientation,

        viewSwitcher,
      )
    );
  }

}

export default Controls;
