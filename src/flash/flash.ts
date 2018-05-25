import { DAP } from "../dap/dap";
import { bufToUint8Array, isBufferBinary, bufToUint32Array } from "../util";

export class Flash {
    private dap: DAP;

    constructor(dap: DAP) {
        this.dap = dap;
    }

    public async flash(buffer: ArrayBuffer, progressCb: (progress: number) => void) {
        const streamType = isBufferBinary(buffer) ? 0 : 1;
        let errorCode = await this.dap.openMSD(streamType);
        if (errorCode[1] !== 0x0) {
            console.log(errorCode[1]);
            return;
        }
        const program = bufToUint8Array(new Uint8Array(buffer));
        let index = 0;
        const pageSize = 62;

        while (index < program.length) {
            let indexEnd = index + pageSize;
            if (indexEnd >= program.length) {
                indexEnd = program.length;
            }
            const programPage = program.slice(index, indexEnd);
            // add information about length
            programPage.unshift(programPage.length);
            errorCode = await this.dap.writeMSD(programPage);
            progressCb(index / program.length);
            index += pageSize;
        }
        errorCode = await this.dap.closeMSD();
        if (errorCode[1] !== 0x0) {
            console.log(errorCode[1]);
            return;
        }
        await this.dap.resetMSD();
        progressCb(1.0);
    }
}
