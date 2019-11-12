import axios from 'axios';
import { browser } from 'webextension-polyfill-ts';

const instance = axios.create({
    timeout: 1000,
    headers: {
        'x-watcha-client': 'watcha-WebApp',
        'x-watcha-client-language': 'ko',
        'x-watcha-client-region': 'KR',
        'x-watcha-client-version': '1.0.0',
        'x-watcha-remote-addr': '127.0.0.1',
    },
});

(() => {
    browser.runtime.onConnect.addListener(async port => {
        if (port.name !== 'watcha') return;

        port.onMessage.addListener(async message => {
            const { id, title, year, duration, isMovie } = message;
            // console.log(message);

            try {
                const cKey = `watcha--${id}`;
                const cResponse = await browser.storage.local.get(cKey);
                const cValue = cResponse[cKey];
                // console.log(cKey);
                // console.log(cValue);

                if (cValue) {
                    return port.postMessage(JSON.parse(cValue));
                }

                const response = await instance.get(
                    `https://api.watcha.com/api/searches?query=${title}`
                );

                const datas = isMovie
                    ? response.data?.result.movies
                    : response.data?.result.tv_seasons;

                if (!datas) return;

                const filteredResult = datas.filter(
                    (arr: {
                        year: number;
                        title: string;
                        ratings_avg: number;
                    }) => {
                        return (
                            arr.year.toString() === year &&
                            arr.title
                                .replace(/ /gi, '')
                                .includes(title.replace(/ /gi, ''))
                        );
                    }
                );

                if (!filteredResult) return;

                const ret = {
                    id,
                    title,
                    year,
                    duration,
                    isMovie,
                    rating: filteredResult[0]?.ratings_avg,
                };

                await browser.storage.local.set({
                    [cKey]: JSON.stringify(ret),
                });

                return port.postMessage(ret);
            } catch (e) {
                console.log(e);
            }
        });
    });
})();
