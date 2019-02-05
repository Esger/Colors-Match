export class tileValueConverter {
    toView(value, params) {
        value = params.board[params.y][params.x];
        return value;
    }
}