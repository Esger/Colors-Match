import { inject } from 'aurelia-framework';
import { DragService } from './resources/services/drag-service';
@inject(DragService)

export class App {
    constructor(dragService) {
        this.ds = dragService;
    }
}