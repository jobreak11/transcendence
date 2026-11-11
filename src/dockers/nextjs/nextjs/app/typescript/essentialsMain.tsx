"use client";

export class MainBody extends HTMLElement {
	connectedCallback() {
		if (this.shadowRoot) return;

		const shadow = this.attachShadow({ mode: "open" });

		shadow.innerHTML = `
			<style>
				:host {
					display: block;
					min-height: 100vh;
					background-color: #262626;
					background-image:
						linear-gradient(
							to bottom,
							rgba(0, 0, 0, 0) 0%,
							rgba(0, 0, 0, 0.25) 60%,
							#000 120%
						),
						url("./res/meshbg1.svg");
					background-repeat: no-repeat, repeat;
					background-size: 100% 100%, 45px 45px;
					color: white;
					font-size: clamp(14px, calc(6px + 2vw), 28px);
				}
			</style>

			<slot></slot>
		`;
	}
}

if (typeof customElements !== "undefined" && !customElements.get("body-main")) {
	customElements.define("body-main", MainBody);
}
// USAGE: use <body-main></body-main> in place of <body></body>