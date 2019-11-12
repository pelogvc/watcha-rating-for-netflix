import { browser } from 'webextension-polyfill-ts';
import axios from 'axios';

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
            try {
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

                return port.postMessage(ret);
            } catch (e) {
                console.log(e);
            }
        });
    });
})();
