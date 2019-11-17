import { browser, Runtime } from 'webextension-polyfill-ts';
import './netflix.scss';

class Watcha {
    private obInterval: number = 500;
    private ob: MutationObserver | undefined;
    private obEl: Element | null | undefined;
    private obOptions: MutationObserverInit = {
        attributes: true,
        attributeFilter: ['class'],
        childList: false,
        characterData: false,
        subtree: true,
        attributeOldValue: true,
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
            name: 'watcha',
        });

        this.bgPort.onMessage.addListener(this.receiveMessage.bind(this));

        this.applyObserver();

        console.log(`Loaded watcha-rating-for-netflix chrome extension`);
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

    private receiveMessage(message: {
        id: string;
        title: string;
        year: number;
        duration: string;
        isMovie: boolean;
        rating: number;
    }) {
        // console.log(message);
        const { id, title, year, duration, isMovie, rating } = message;
        const container = document.getElementById(id);

        if (!container) return;

        const meta = container.querySelector('.meta');

        if (meta?.querySelector('.watcha-rating')) return;

        const icoStar = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="star" class="svg-inline--fa fa-star fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>`;
        const icoStarNo = `<svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="star" class="svg-inline--fa fa-star fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M528.1 171.5L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6zM388.6 312.3l23.7 138.4L288 385.4l-124.3 65.3 23.7-138.4-100.6-98 139-20.2 62.2-126 62.2 126 139 20.2-100.6 98z"></path></svg>`;

        const starRating = Math.round(rating / 2);
        let star = ``;
        for (let i = 1; i <= 5; i++) {
            star += i <= starRating ? icoStar : icoStarNo;
        }
        const injectHtml = `
            <span class="watcha-rating">
                ${star}
                <span class="rate">${(rating / 2).toFixed(1)}</span>
            </span>
        `;

        meta!.insertAdjacentHTML('beforeend', injectHtml);
    }

    private isMovie(duration: string): boolean {
        return !!(duration.includes('시간') || duration.includes('분'));
    }

    private proccessObserverManager(mutationRecords: MutationRecord[]) {
        mutationRecords.forEach(async mutationRecord => {
            const target = mutationRecord.target as Element;
            // console.log(target);
            // console.log(mutationRecord);
            if (
                !target.classList.contains('jawBoneOpenContainer') &&
                !target.classList.contains('jawBoneContainer') &&
                !target.classList.contains('jawBoneFadeInPlaceContainer') // jawBoneFadeInPlace-enter-active
            ) {
                return;
            }
            // if (target.classList.contains('slider-hover-trigger-layer')) return;

            const id = target
                .querySelector('.jawbone-title-link')
                ?.getAttribute('href')
                ?.replace(/[^0-9]/g, '');
            const title = target.querySelector('.logo')?.getAttribute('alt');
            const year = target.querySelector('.year')?.textContent;
            const duration = target.querySelector('.duration')?.textContent;

            if (!title || !year || !duration) return;
            if (this.searchLastData === id) return;

            this.searchLastData = id;
            // console.log(id, title, year, duration, this.isMovie(duration));
            this.bgPort.postMessage({
                id,
                title,
                year,
                duration,
                isMovie: this.isMovie(duration),
            });
        });
    }

    private proccessApplyObserver() {
        this.obEl = document.querySelector('.mainView');

        if (!this.obEl) return false;

        this.ob = new MutationObserver(this.proccessObserverManager.bind(this));

        this.ob.observe(this.obEl, this.obOptions);

        return true;
    }
}

(() => {
    const watcha = new Watcha({
        childList: false,
        attributes: true,
        characterData: true,
        subtree: true,
        attributeOldValue: true,
        characterDataOldValue: true,
    });
})();
