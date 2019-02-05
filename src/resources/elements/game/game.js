import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DragService } from 'resources/services/drag-service';

@inject(DragService, EventAggregator)
export class GameCustomElement {

    constructor(dragService, eventAggregator) {
        this.dragService = dragService;
        this._eventAggregator = eventAggregator;
        this._resetScore();
    }

    attached() {
        this.highSubscriber = this._eventAggregator.subscribe('high', value => {
            this.title = value + '+' + value;
        });
        this.scoreSubscriber = this._eventAggregator.subscribe('score', value => {
            this.score += value;
        });
        this.resetScoreSubscriber = this._eventAggregator.subscribe('reset-score', value => {
            this._resetScore();
        });
    }

    _resetScore() {
        this.title = '1+1';
        this.score = 0;
    }

    restart() {
        this._eventAggregator.publish('restart');
    }

    detached() {
        this.highSubscriber.dispose();
        this.scoreSubscriber.dispose();
        this.resetScoreSubscriber.dispose();
    }

}
