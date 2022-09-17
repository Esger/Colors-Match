import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)

export class ScoreService {

    constructor(eventAggregator) {
        this.ea = eventAggregator;
        this.score = {};
        this.ea.subscribe('resetHighScore', response => {
            this.resetHighScore(response);
        });
    }

    getScore() {
        const score = localStorage.getItem('one-color-scores');
        if (score) {
            this.score = JSON.parse(score);
            return this.score;
        } else {
            return 1;
        }
    }

    saveScore(score) {
        if (score) {
            this.score = score;
            localStorage.setItem('one-color-scores', JSON.stringify(score));
        }
        this.ea.publish('updateStatus');
    }

    resetHighScore(level) {
        this.score[level] = 0;
        this.saveScore(this.score);
        this.ea.publish('updateStatus');
    }

}
