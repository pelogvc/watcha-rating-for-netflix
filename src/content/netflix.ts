import { browser, Runtime } from 'webextension-polyfill-ts';

class Netflix {
    private obInterval: number = 500;
    private ob: MutationObserver | undefined;
    private obEl: Element | null | undefined;
    private obOptions: MutationObserverInit = {
        attributes: true,
        attributeFilter: ['class'],
        childList: true,
        characterData: false,
        subtree: true,
        attributeOldValue: false,
    };
    private obTimer: any;
    private bgPort: Runtime.Port;
    private searchLastData: string | undefined = '';

    constructor(options: MutationObserverInit = {}) {
        this.obOptions = {
            ...this.obOptions,
            ...options,
        };

        // connect background
        this.bgPort = browser.runtime.connect(undefined, {
            name: 'netflix',
        });

        this.bgPort.onMessage.addListener(this.receiveMessage.bind(this));

        this.applyObserver();
    }

    public applyObserver() {
        if (this.obTimer) return clearTimeout(this.obTimer);
        if (!this.proccessApplyObserver()) {
            this.obTimer = setTimeout(
                this.applyObserver.bind(this),
                this.obInterval
            );
        }
    }

    private receiveMessage(
        message: { id: string; data: object },
        port: Runtime.Port
    ) {
        console.log(message);
    }

    private isMovie(duration: string): boolean {
        return !!(duration.includes('시간') || duration.includes('분'));
    }

    private proccessObserverManager(mutationRecords: MutationRecord[]) {
        mutationRecords.forEach(async mutationRecord => {
            const target = mutationRecord.target as Element;

            if (
                !target.classList.contains('jawBoneOpenContainer') &&
                !target.classList.contains('jawBoneContainer')
            ) {
                return;
            }
            const id =
                target.id || target.querySelector('.jawBoneContainer')?.id;
            const title = target.querySelector('.logo')?.getAttribute('alt');
            const year = target.querySelector('.year')?.textContent;
            const duration = target.querySelector('.duration')?.textContent;

            if (!title || !year || !duration) return;
            if (this.searchLastData === id) return;

            this.searchLastData = id;
            console.log(id, title, year, duration, this.isMovie(duration));
        });
    }

    private proccessApplyObserver() {
        this.obEl = document.querySelector('.mainView');

        if (!this.obEl) return false;

        this.ob = new MutationObserver(this.proccessObserverManager.bind(this));

        this.ob.observe(this.obEl, this.obOptions);

        console.log(`apply observer: ${this.obEl}`);

        return true;
    }
}

(() => {
    const netflix = new Netflix();
})();
