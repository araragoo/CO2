// https://github.com/araragoo/CO2

//% weight=5 color=#0fbc11 icon="\uf112" block="Measurement"
namespace CO2 {

    let CO2data = 400
    let buffer: Buffer = null
    let buf  = control.createBuffer(9)
    let buf0 = control.createBuffer(9)

    //% subcategory="CO2"
    //% blockId=setOffset
    //% block="Set CO2 value as 400ppm"
    export function CO2SetOffset () {

        basic.showString("Wait 20min for setting 400ppm! ")
        for (let m = 0; m < 20; m++) {
            for (let index = 0; index < 12; index++) {
                basic.showString("" + convertToText(21 - m) + "m")
            }
        }
        for (let s = 0; s < 12; s++) {
            basic.showString("" + convertToText(60 - s*5) + "s")
        }

        serial.writeBuffer(buf0)
        basic.pause(100)
        basic.showString("Done!")
    }

    //% subcategory="CO2"
    //% blockId=measureCO2
    //% block="CO2[ppm]"
    export function CO2Value(): number {

        serial.writeBuffer(buf)
        basic.pause(100)

        buffer = serial.readBuffer(9)
        if (buffer.getNumber(NumberFormat.UInt8LE, 0) == 255 && buffer.getNumber(NumberFormat.UInt8LE, 1) == 134) {
//            let sum = 0
//            for (let index = 0; index <= 7; index++) {
//                sum = sum + buffer.getNumber(NumberFormat.UInt8LE, index)
//            }
//            sum = sum % 256
//            sum = 255 - sum
//            if (sum == buffer.getNumber(NumberFormat.UInt8LE, 8)) {
                CO2data = buffer.getNumber(NumberFormat.UInt8LE, 2) * 256 + buffer.getNumber(NumberFormat.UInt8LE, 3)
//            }
        }
        return CO2data
    }

    //% subcategory="CO2"
    //% blockId=initalCO2
    //% block="Init CO2"
    export function CO2Init () {
        serial.redirect(
            SerialPin.P13,
            SerialPin.P14,
            BaudRate.BaudRate9600
        )
        buf.setNumber(NumberFormat.UInt8LE, 0, 255)
        buf.setNumber(NumberFormat.UInt8LE, 1, 1)
        buf.setNumber(NumberFormat.UInt8LE, 2, 134)
        buf.setNumber(NumberFormat.UInt8LE, 3, 0)
        buf.setNumber(NumberFormat.UInt8LE, 4, 0)
        buf.setNumber(NumberFormat.UInt8LE, 5, 0)
        buf.setNumber(NumberFormat.UInt8LE, 6, 0)
        buf.setNumber(NumberFormat.UInt8LE, 7, 0)
        buf.setNumber(NumberFormat.UInt8LE, 8, 121)

        buf0.setNumber(NumberFormat.UInt8LE, 0, 255)
        buf0.setNumber(NumberFormat.UInt8LE, 1, 1)
        buf0.setNumber(NumberFormat.UInt8LE, 2, 135)
        buf0.setNumber(NumberFormat.UInt8LE, 3, 0)
        buf0.setNumber(NumberFormat.UInt8LE, 4, 0)
        buf0.setNumber(NumberFormat.UInt8LE, 5, 0)
        buf0.setNumber(NumberFormat.UInt8LE, 6, 0)
        buf0.setNumber(NumberFormat.UInt8LE, 7, 0)
        buf0.setNumber(NumberFormat.UInt8LE, 8, 120)
    }



    const MLX90614_I2CADDR = 0x5A;
    const MLX90614_TA = 0x06;
    const MLX90614_TOBJ1 = 0x07;
    const MLX90614_EMISS = 0x24;
    
    let crcBuf: number[] = [];
    function crc8(len: number): number {
    // The PEC calculation includes all bits except the START, REPEATED START, STOP,
    // ACK, and NACK bits. The PEC is a CRC-8 with polynomial X8+X2+X1+1.
        let crc = 0;
        for (let j = 0; j < len; j++) {
            let inbyte = crcBuf[j];
            for (let i = 8; i; i--) {
                let carry = (crc ^ inbyte) & 0x80;
                crc <<= 1;
                if (carry)
                    crc ^= 0x7;
                inbyte <<= 1;
            }
        }
        return crc & 0xFF;
    }

    function write16(reg: NumberFormat.UInt8BE, value: number) {
        crcBuf[0] = MLX90614_I2CADDR << 1;
        crcBuf[1] = reg;
        crcBuf[2] = value & 0xff;
        crcBuf[3] = (value >> 8) & 0xff;
        let pec = crc8(4);
        let buf = (crcBuf[1]<<24) + (crcBuf[2]<<16) + (crcBuf[3]<<8) + pec;
        //let b = crcBuf[1] + crcBuf[2] << 8 + crcBuf[3] << 16 + (pec << 24);
        pins.i2cWriteNumber(MLX90614_I2CADDR, buf, NumberFormat.UInt32BE, false);
    }

    function read16(reg: NumberFormat.UInt8BE): number {
        pins.i2cWriteNumber(MLX90614_I2CADDR, reg, NumberFormat.UInt8BE, true);
        let ret = pins.i2cReadNumber(MLX90614_I2CADDR, NumberFormat.UInt16LE, false);
        //ret |= pins.i2cReadNumber(addr, NumberFormat.UInt16LE) << 8
        return ret
    }

    function readTemp(reg: NumberFormat.UInt8BE): number {
        let temp = read16(reg)
        temp *= .02
        temp -= 273.15
        return temp
    }
    
    let k_body = 1.06;
    //% subcategory="Temp"
    //% blockId=setPrm
    //% block="Set Body temperature correction value %prm"
    //% prm.defl=1.06
    export function TempSetPrm(prm: number) {
        k_body = prm;
    }

    //% subcategory="Temp"
    //% blockId=setEmiss
    //% block="Set Emissivity %emiss"
    //% emiss.defl=1
    export function TempSetEmiss(emiss: number) {
        write16(MLX90614_EMISS, 0);
        basic.pause(100)
        write16(MLX90614_EMISS, emiss * 0xffff);
        basic.pause(100)
    }

    //% subcategory="Temp"
    //% blockId=readEmiss
    //% block="Read Emissivity"
    export function TempEmiss(): number {
        let ereg = read16(MLX90614_EMISS)
        if (ereg == 0)
          return 0;
        return ereg / 65535.0;
    }

    //% subcategory="Temp"
    //% blockId=ambientTemp
    //% block="Measure Ambient Temperature"
    export function TempAmbientTemp(): number {
        return readTemp(MLX90614_TA);
    }

    //% subcategory="Temp"
    //% blockId=objectTemp
    //% block="Measure Object Temperature"
    export function TempObjectTemp(): number {
        return readTemp(MLX90614_TOBJ1);
    }

    //% subcategory="Temp"
    //% blockId=bodyTemp
    //% block="Measure Body Temperature"
    export function TempBodyTemp(): number {
        return readTemp(MLX90614_TOBJ1) * k_body;
    }

    //% subcategory="Temp"
    //% blockId=bodyTempAve
    //% block="Body Temperature Average %num"
    //% num.defl=1000 num.min=1 num.max=10000
    export function TempBodyTempAve(num: number): number {
        let sum = 0;
        
        for(let i=0; i < num; i++) {
            sum += readTemp(MLX90614_TOBJ1);
        }
        sum = sum * k_body / num ;
        return sum;
    }












const MAX30100_I2C_ADDRESS              = 0x57;

// Mode Configuration register
const MAX30100_REG_MODE_CONFIGURATION   = 0x06;
const MAX30100_REG_SPO2_CONFIGURATION   = 0x07;
const MAX30100_REG_LED_CONFIGURATION    = 0x09;

const MAX30100_SPC_SPO2_HI_RES_EN       = 1 << 6;

    function i2cwrite(addr: number, reg: number, value: number) {
        //pins.i2cWriteNumber(addr, reg * 256 + value, NumberFormat.UInt16BE)
        //NG:pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE, true);
        //NG:pins.i2cWriteNumber(addr, value, NumberFormat.UInt8BE, false);
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = value;
        pins.i2cWriteBuffer(addr, buf, false);
    }

    function i2cread(addr: number, reg: number): number {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        //let X
        //let buf = pins.createBufferFromArray([X]) // ex. [X, Y, Z]
        //buf = pins.i2cReadBuffer(addr, 1)
        //return buf[0]
    }

    let readbuf: Buffer;

    function i2creads(addr: number, reg: number, size: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        readbuf = pins.i2cReadBuffer(addr, size)    
    }


    let irDCRemover: number;
    let redDCRemover: number;
    let spo2_state: number;
    
    function setMode(mode: number) {
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_MODE_CONFIGURATION, mode);
    }
    
    function setLedsPulseWidth(ledPulseWidth: number) {
        let previous = i2cread(MAX30100_I2C_ADDRESS, MAX30100_REG_SPO2_CONFIGURATION);
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_SPO2_CONFIGURATION, (previous & 0xfc) | ledPulseWidth);
    }
    
    function setSamplingRate(samplingRate: number) {
        let previous = i2cread(MAX30100_I2C_ADDRESS, MAX30100_REG_SPO2_CONFIGURATION);
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_SPO2_CONFIGURATION, (previous & 0xe3) | (samplingRate << 2));
    }
    
    function setLedsCurrent(irLedCurrent: number, redLedCurrent: number) {
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_LED_CONFIGURATION, redLedCurrent << 4 | irLedCurrent);
    }
    
    function setHighresModeEnabled(enabled: boolean){
        let previous = i2cread(MAX30100_I2C_ADDRESS, MAX30100_REG_SPO2_CONFIGURATION);
        if (enabled) {
            i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_SPO2_CONFIGURATION, previous | MAX30100_SPC_SPO2_HI_RES_EN);
        } else {
            i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_SPO2_CONFIGURATION, previous & ~MAX30100_SPC_SPO2_HI_RES_EN);
        }
    }

    //% subcategory="SpO2"
    //% blockId=initalSpO2
    //% block="Init SpO2"
    export function SpO2Init () {
    
        setMode(DEFAULT_MODE);
        setLedsPulseWidth(DEFAULT_PULSE_WIDTH);
        setSamplingRate(DEFAULT_SAMPLING_RATE);
        setLedsCurrent(DEFAULT_IR_LED_CURRENT, DEFAULT_RED_LED_CURRENT);
        setHighresModeEnabled(true);
    //
        setMode(MAX30100_MODE_SPO2_HR);
        setLedsCurrent(irLedCurrent, (LEDCurrent)redLedCurrentIndex);
    
        irDCRemover = DCRemover(DC_REMOVER_ALPHA);
        redDCRemover = DCRemover(DC_REMOVER_ALPHA);
    
        spo2_state = PULSEOXIMETER_STATE_IDLE;
    }
    
















   
 
}




