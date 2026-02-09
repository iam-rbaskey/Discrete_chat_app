
import { global } from 'styled-jsx/css';

declare global {
    var mongoose: {
        conn: any;
        promise: Promise<any> | null;
    };
}

export { };
