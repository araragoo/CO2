// https://github.com/araragoo/CO2

//% weight=5 color=#0fbc11 icon="\uf112" block="Measurement"
namespace CO2 {

    let CO2data = 400
    let buffer = pins.createBuffer(9)
    let cmd_get = pins.createBuffer(9)
    let cmd_zero_cal = pins.createBuffer(9)
    let cmd_span_cal = pins.createBuffer(9)
    let cmd_auto_on = pins.createBuffer(9)
    let cmd_auto_off = pins.createBuffer(9)

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

        serial.writeBuffer(cmd_zero_cal)
        basic.pause(100)
        basic.showString("Done!")
    }

    //% subcategory="CO2"
    //% blockId=measureCO2
    //% block="CO2[ppm]"
    export function CO2Value(): number {

        serial.writeBuffer(cmd_get)
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
    //% block="Init CO2 AutoCalibraton ON:1 OFF:0 %onoff"
    //% onoff.min=0 onoff.max=1 onoff.defl=1
    export function CO2Init(onoff: number) {
        basic.pause(1000)
        serial.redirect(
            SerialPin.P8, //tx
            SerialPin.P12, //rx
            BaudRate.BaudRate9600
        )
        cmd_get.setNumber(NumberFormat.UInt8LE, 0, 255)
        cmd_get.setNumber(NumberFormat.UInt8LE, 1, 1)
        cmd_get.setNumber(NumberFormat.UInt8LE, 2, 134)
        cmd_get.setNumber(NumberFormat.UInt8LE, 3, 0)
        cmd_get.setNumber(NumberFormat.UInt8LE, 4, 0)
        cmd_get.setNumber(NumberFormat.UInt8LE, 5, 0)
        cmd_get.setNumber(NumberFormat.UInt8LE, 6, 0)
        cmd_get.setNumber(NumberFormat.UInt8LE, 7, 0)
        cmd_get.setNumber(NumberFormat.UInt8LE, 8, 121)

        cmd_zero_cal.setNumber(NumberFormat.UInt8LE, 0, 255)
        cmd_zero_cal.setNumber(NumberFormat.UInt8LE, 1, 1)
        cmd_zero_cal.setNumber(NumberFormat.UInt8LE, 2, 135)
        cmd_zero_cal.setNumber(NumberFormat.UInt8LE, 3, 0)
        cmd_zero_cal.setNumber(NumberFormat.UInt8LE, 4, 0)
        cmd_zero_cal.setNumber(NumberFormat.UInt8LE, 5, 0)
        cmd_zero_cal.setNumber(NumberFormat.UInt8LE, 6, 0)
        cmd_zero_cal.setNumber(NumberFormat.UInt8LE, 7, 0)
        cmd_zero_cal.setNumber(NumberFormat.UInt8LE, 8, 120)

        cmd_auto_on.setNumber(NumberFormat.UInt8LE, 0, 255)
        cmd_auto_on.setNumber(NumberFormat.UInt8LE, 1, 1)
        cmd_auto_on.setNumber(NumberFormat.UInt8LE, 2, 121)
        cmd_auto_on.setNumber(NumberFormat.UInt8LE, 3, 160)
        cmd_auto_on.setNumber(NumberFormat.UInt8LE, 4, 0)
        cmd_auto_on.setNumber(NumberFormat.UInt8LE, 5, 0)
        cmd_auto_on.setNumber(NumberFormat.UInt8LE, 6, 0)
        cmd_auto_on.setNumber(NumberFormat.UInt8LE, 7, 0)
        cmd_auto_on.setNumber(NumberFormat.UInt8LE, 8, 230)

        cmd_auto_off.setNumber(NumberFormat.UInt8LE, 0, 255)
        cmd_auto_off.setNumber(NumberFormat.UInt8LE, 1, 1)
        cmd_auto_off.setNumber(NumberFormat.UInt8LE, 2, 121)
        cmd_auto_off.setNumber(NumberFormat.UInt8LE, 3, 0)
        cmd_auto_off.setNumber(NumberFormat.UInt8LE, 4, 0)
        cmd_auto_off.setNumber(NumberFormat.UInt8LE, 5, 0)
        cmd_auto_off.setNumber(NumberFormat.UInt8LE, 6, 0)
        cmd_auto_off.setNumber(NumberFormat.UInt8LE, 7, 0)
        cmd_auto_off.setNumber(NumberFormat.UInt8LE, 8, 134)

        if (onoff==1) {
            serial.writeBuffer(cmd_auto_on)
        } else {
            serial.writeBuffer(cmd_auto_off)
        }
        basic.pause(100)
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

const MAX30100_FIFO_DEPTH               = 0x10;

// Mode Configuration register
const MAX30100_REG_MODE_CONFIGURATION   = 0x06;
const MAX30100_REG_SPO2_CONFIGURATION   = 0x07;
const MAX30100_REG_LED_CONFIGURATION    = 0x09;
const MAX30100_SPC_SPO2_HI_RES_EN       = 1 << 6;

const MAX30100_MODE_HRONLY              = 0x02;
const MAX30100_MODE_SPO2_HR             = 0x03;

//const MAX30100_SAMPRATE_50HZ            = 0x00;
const MAX30100_SAMPRATE_100HZ           = 0x01;
//const MAX30100_SAMPRATE_167HZ           = 0x02;
//const MAX30100_SAMPRATE_200HZ           = 0x03;
//const MAX30100_SAMPRATE_400HZ           = 0x04;
//const MAX30100_SAMPRATE_600HZ           = 0x05;
//const MAX30100_SAMPRATE_800HZ           = 0x06;
//const MAX30100_SAMPRATE_1000HZ          = 0x07;

//const MAX30100_SPC_PW_200US_13BITS    = 0x00;
//const MAX30100_SPC_PW_400US_14BITS    = 0x01;
//const MAX30100_SPC_PW_800US_15BITS    = 0x02;
const MAX30100_SPC_PW_1600US_16BITS   = 0x03;

//const MAX30100_LED_CURR_0MA           = 0x00;
//const MAX30100_LED_CURR_4_4MA         = 0x01;
//const MAX30100_LED_CURR_7_6MA         = 0x02;
//const MAX30100_LED_CURR_11MA          = 0x03;
//const MAX30100_LED_CURR_14_2MA        = 0x04;
//const MAX30100_LED_CURR_17_4MA        = 0x05;
//const MAX30100_LED_CURR_20_8MA        = 0x06;
//const MAX30100_LED_CURR_24MA          = 0x07;
const MAX30100_LED_CURR_27_1MA        = 0x08;
//const MAX30100_LED_CURR_30_6MA        = 0x09;
//const MAX30100_LED_CURR_33_8MA        = 0x0a;
//const MAX30100_LED_CURR_37MA          = 0x0b;
//const MAX30100_LED_CURR_40_2MA        = 0x0c;
//const MAX30100_LED_CURR_43_6MA        = 0x0d;
//const MAX30100_LED_CURR_46_8MA        = 0x0e;
const MAX30100_LED_CURR_50MA            = 0x0f;

const MAX30100_REG_TEMPERATURE_DATA_INT     = 0x16;
const MAX30100_REG_TEMPERATURE_DATA_FRAC    = 0x17;
const MAX30100_MC_TEMP_EN                   = 1 << 3;

const DEFAULT_MODE                      = MAX30100_MODE_HRONLY;
const DEFAULT_SAMPLING_RATE             = MAX30100_SAMPRATE_100HZ;
const DEFAULT_PULSE_WIDTH               = MAX30100_SPC_PW_1600US_16BITS;
const DEFAULT_RED_LED_CURRENT           = MAX30100_LED_CURR_50MA;
const DEFAULT_IR_LED_CURRENT            = MAX30100_LED_CURR_50MA;
const RINGBUFFER_SIZE                   = 16;

const CURRENT_ADJUSTMENT_PERIOD_MS      = 500;
const RED_LED_CURRENT_START             = MAX30100_LED_CURR_27_1MA;
const DC_REMOVER_ALPHA                  = 0.95;

const PULSEOXIMETER_STATE_INIT      = 0;
const PULSEOXIMETER_STATE_IDLE      = 1;
const PULSEOXIMETER_STATE_DETECTING = 2;

const MAX30100_REG_FIFO_WRITE_POINTER           = 0x02;
const MAX30100_REG_FIFO_OVERFLOW_COUNTER        = 0x03;
const MAX30100_REG_FIFO_READ_POINTER            = 0x04;
const MAX30100_REG_FIFO_DATA                    = 0x05;  // Burst read does not autoincrement addr

const SPO2_MEASUREMENT_TIME_MS = 1000;

const BEATDETECTOR_INIT_HOLDOFF                 = 2000;    // in ms, how long to wait before counting
const BEATDETECTOR_MASKING_HOLDOFF              = 200;     // in ms, non-retriggerable window after beat detection
const BEATDETECTOR_BPFILTER_ALPHA               = 0.6;     // EMA factor for the beat period value
const BEATDETECTOR_MIN_THRESHOLD                = 20;      // minimum threshold (filtered) value
const BEATDETECTOR_MAX_THRESHOLD                = 800;     // maximum threshold (filtered) value
const BEATDETECTOR_STEP_RESILIENCY              = 30;      // maximum negative jump that triggers the beat edge
const BEATDETECTOR_THRESHOLD_FALLOFF_TARGET     = 0.3;     // thr chasing factor of the max value when beat
const BEATDETECTOR_THRESHOLD_DECAY_FACTOR       = 0.99;    // thr chasing factor when no beat
const BEATDETECTOR_INVALID_READOUT_DELAY        = 2000;    // in ms, no-beat time to cause a reset
const BEATDETECTOR_SAMPLES_PERIOD               = 10       // in ms, 1/Fs

const BEATDETECTOR_STATE_INIT               = 0;
const BEATDETECTOR_STATE_WAITING            = 1;
const BEATDETECTOR_STATE_FOLLOWING_SLOPE    = 2;
const BEATDETECTOR_STATE_MAYBE_DETECTED     = 3;
const BEATDETECTOR_STATE_MASKING            = 4;

const CALCULATE_EVERY_N_BEATS   = 3;
const spO2LUT: number[] = [100,100,100,100,99,99,99,99,99,99,98,98,98,98,
    98,97,97,97,97,97,97,96,96,96,96,96,96,95,95,
    95,95,95,95,94,94,94,94,94,93,93,93,93,93];

let irCDalpha = DC_REMOVER_ALPHA;
let irDCdcw = 0;
let irOldDCdcw = 0;
let redCDalpha = DC_REMOVER_ALPHA;
let redDCdcw = 0;
let redOldDCdcw = 0;
let filterV0 = 0;
let filterV1 = 0;

let redLedCurrentIndex = RED_LED_CURRENT_START;
let irLedCurrent = DEFAULT_IR_LED_CURRENT;
let readbuf: Buffer;

let sense_red: number[] = [];
let sense_IR: number[] = [];
//    let sense_green: number[] = [];
let sense_head = 0;
let sense_tail = 0;   
let tsLastBiasCheck = 0;
let tsLastCurrentAdjustment = 0;

let beatState = BEATDETECTOR_STATE_INIT;
let threshold = BEATDETECTOR_MIN_THRESHOLD;
let tsLastBeat = 0;
let lastMaxValue = 0;
let beatPeriod = 0;

let pulseState = PULSEOXIMETER_STATE_INIT;
let irACValueSqSum = 0;
let redACValueSqSum = 0;
let beatsDetectedNum = 0;
let samplesRecorded = 0;
let spO2 = 0;
let HeartRate = 0;

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

    function i2creads(addr: number, reg: number, size: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        readbuf = pins.i2cReadBuffer(addr, size) ;   
    }

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
    
    function setHighresModeEnabled(enabled: boolean) {
        let previous = i2cread(MAX30100_I2C_ADDRESS, MAX30100_REG_SPO2_CONFIGURATION);
        if (enabled) {
            i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_SPO2_CONFIGURATION, previous | MAX30100_SPC_SPO2_HI_RES_EN);
        } else {
            i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_SPO2_CONFIGURATION, previous & ~MAX30100_SPC_SPO2_HI_RES_EN);
        }
    }

    function burstRead(baseAddress: number, length: number) {
        i2creads(MAX30100_I2C_ADDRESS, baseAddress, length);
    }

    function available(): number {
        let numberOfSamples = sense_head - sense_tail;
        if (numberOfSamples < 0) numberOfSamples += RINGBUFFER_SIZE;
        
        return (numberOfSamples);
    }

    function nextSample(): number{
        if(available()) { //Only advance the tail if new data is available
            sense_tail++;
            sense_tail %= RINGBUFFER_SIZE; //Wrap condition
            return 1;
        } else {
            return 0;
        }
    }
    
    function resetFifo() {
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_FIFO_WRITE_POINTER, 0);
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_FIFO_READ_POINTER, 0);
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_FIFO_OVERFLOW_COUNTER, 0);
    }

    function readFifoData() {
        let writePointer = i2cread(MAX30100_I2C_ADDRESS, MAX30100_REG_FIFO_WRITE_POINTER);
//basic.showNumber(writePointer);
        let readPointer = i2cread(MAX30100_I2C_ADDRESS, MAX30100_REG_FIFO_READ_POINTER);
//basic.showNumber(readPointer);
        let toRead = (writePointer - readPointer) & (MAX30100_FIFO_DEPTH-1);
        if(toRead == 0) {
            toRead = MAX30100_FIFO_DEPTH;
        }
//basic.showNumber(toRead);

        if (toRead) {
            burstRead(MAX30100_REG_FIFO_DATA, 4 * toRead);
    
            //sense_tail = sense_head;
            for (let i=0 ; i < toRead ; ++i) {
                sense_head++;
                sense_head %= RINGBUFFER_SIZE;
                sense_tail = sense_head + 1;
                sense_tail %= RINGBUFFER_SIZE;    

                sense_IR[sense_head]  = (readbuf[i*4] << 8) | readbuf[i*4 + 1];
                sense_red[sense_head] = (readbuf[i*4 + 2] << 8) | readbuf[i*4 + 3];
            }
//basic.showNumber(sense_IR[sense_head]);
        }
    }

    function SPO2update() {
        readFifoData();
        checkSample();
        checkCurrentBias();
    }
     
    function irDCRemoverStep(x: number): number {
		irOldDCdcw = irDCdcw;
		irDCdcw = x + irCDalpha * irDCdcw;
		return irDCdcw - irOldDCdcw;
	}

    function redDCRemoverStep(x: number): number {
		redOldDCdcw = redDCdcw;
		redDCdcw = x + redCDalpha * redDCdcw;
		return redDCdcw - redOldDCdcw;
	}

    function filterBuLp1Step(x: number): number {
        filterV0 = filterV1;
    	filterV1 = (2.452372752527856026e-1 * x)
                + (0.50952544949442879485 * filterV0);
		return filterV0 + filterV1;
	}

    function decreaseThreshold() {
        // When a valid beat rate readout is present, target the
        if (lastMaxValue > 0 && beatPeriod > 0) {
            threshold -= lastMaxValue * (1 - BEATDETECTOR_THRESHOLD_FALLOFF_TARGET) /
                    (beatPeriod / BEATDETECTOR_SAMPLES_PERIOD);
        } else {
            // Asymptotic decay
            threshold *= BEATDETECTOR_THRESHOLD_DECAY_FACTOR;
        }

        if (threshold < BEATDETECTOR_MIN_THRESHOLD) {
            threshold = BEATDETECTOR_MIN_THRESHOLD;
        }
    }

    function checkForBeat(sample: number): boolean {
        let beatDetected = false;

        switch (beatState) {
            case BEATDETECTOR_STATE_INIT:
                if (control.millis() > BEATDETECTOR_INIT_HOLDOFF) {
                    beatState = BEATDETECTOR_STATE_WAITING;
                }
                break;

            case BEATDETECTOR_STATE_WAITING:
                if (sample > threshold) {
                    //threshold = min(sample, BEATDETECTOR_MAX_THRESHOLD);
                    threshold = sample <  BEATDETECTOR_MAX_THRESHOLD ? sample : BEATDETECTOR_MAX_THRESHOLD; 
                    beatState = BEATDETECTOR_STATE_FOLLOWING_SLOPE;
                }

                // Tracking lost, resetting
                if (control.millis() - tsLastBeat > BEATDETECTOR_INVALID_READOUT_DELAY) {
                    beatPeriod = 0;
                    lastMaxValue = 0;
                }

                decreaseThreshold();
                break;

            case BEATDETECTOR_STATE_FOLLOWING_SLOPE:
                if (sample < threshold) {
                    beatState = BEATDETECTOR_STATE_MAYBE_DETECTED;
                } else {
                    //threshold = min(sample, BEATDETECTOR_MAX_THRESHOLD);
                    threshold = sample <  BEATDETECTOR_MAX_THRESHOLD ? sample : BEATDETECTOR_MAX_THRESHOLD; 
                }
                break;

            case BEATDETECTOR_STATE_MAYBE_DETECTED:
                if (sample + BEATDETECTOR_STEP_RESILIENCY < threshold) {
                    // Found a beat
                    beatDetected = true;
                    lastMaxValue = sample;
                    beatState = BEATDETECTOR_STATE_MASKING;
                    let delta = control.millis() - tsLastBeat;
                    if (delta) {
                        beatPeriod = BEATDETECTOR_BPFILTER_ALPHA * delta +
                                (1 - BEATDETECTOR_BPFILTER_ALPHA) * beatPeriod;
                    }

                    tsLastBeat = control.millis();
                } else {
                    beatState = BEATDETECTOR_STATE_FOLLOWING_SLOPE;
                }
                break;

            case BEATDETECTOR_STATE_MASKING:
                if (control.millis() - tsLastBeat > BEATDETECTOR_MASKING_HOLDOFF) {
                    beatState = BEATDETECTOR_STATE_WAITING;
                }
                decreaseThreshold();
                break;
        }

        return beatDetected;
    }

    function getRate(): number {
        if (beatPeriod != 0) {
            HeartRate = 1 / beatPeriod * 1000 * 60;
        } else {
            HeartRate = 0;
        }
        return HeartRate;
    }
    
    function sublog(z: number): number {
        let	y;
        let	b, k;
        let	n;

        if( z==2.0 ){	return( 0.6931471805599449 );	}
        y = ( z - 1 );
        b = y;
        n = 2;
        while( true ){
            b = b * ( z - 1 );
            k = b / n;
            if( -0.0000001<k && k<0.0000001 )	break;
            if( (n % 2)==0 ){
                y = y - k;
            }else{
                y = y + k;
            }
            n++;
        }
        return( y );
    }

    function log(x: number): number {
        let	y = 0.0;
        let	d, e, c;
        
        if(x == 2){
            return( 0.6931471805599449 );
        }else if( x<2 ){
            y = sublog( x );
        }else{
            c = 1.0;
            d = 1.0;
            while( true ){
                d *= 2.0;
                e = x / d;
                if( e<=2.0 )	break;
                c++;
            }
            y = c * 0.6931471805599449 + sublog( e );
        }
        return( y );
    }

    function spO2CalculatorReset() {
        samplesRecorded = 0;
        redACValueSqSum = 0;
        irACValueSqSum = 0;
        beatsDetectedNum = 0;
        spO2 = 0;
        HeartRate = 0;
    }

    function spO2CalculatorUpdate(irACValue: number, redACValue: number, beatDetected: boolean) {
        irACValueSqSum += irACValue * irACValue;
        redACValueSqSum += redACValue * redACValue;
        ++samplesRecorded;

        if (beatDetected) {
            ++beatsDetectedNum;
            if (beatsDetectedNum == CALCULATE_EVERY_N_BEATS) {
                let acSqRatio = 100.0 * log(redACValueSqSum/samplesRecorded) / log(irACValueSqSum/samplesRecorded);
                let index = 0;

                if (acSqRatio > 66) {
                    index = acSqRatio - 66;
                } else if (acSqRatio > 50) {
                    index = acSqRatio - 50;
                }
                spO2CalculatorReset();

                spO2 = spO2LUT[index];
            }
        }
    }

    let rawIRValue = 0;
    let rawRedValue = 0;
    let irACValue = 0;
    let redACValue = 0;
    let filteredPulseValue = 0;
    let beatDetected: boolean;

    function checkSample() {
        let index = sense_head;
        while (index != sense_tail) {
/*
            let rawIRValue = sense_IR[index];
            let rawRedValue = sense_red[index];

            let irACValue = irDCRemoverStep(rawIRValue);
            let redACValue = redDCRemoverStep(rawRedValue);

            let filteredPulseValue = filterBuLp1Step(-irACValue);
            let beatDetected = checkForBeat(filteredPulseValue);
*/
            rawIRValue = sense_IR[index];
            rawRedValue = sense_red[index];

            irACValue = irDCRemoverStep(rawIRValue);
            redACValue = redDCRemoverStep(rawRedValue);

            filteredPulseValue = filterBuLp1Step(-irACValue);
            beatDetected = checkForBeat(filteredPulseValue);

            if (getRate() > 0) {
                pulseState = PULSEOXIMETER_STATE_DETECTING;
                spO2CalculatorUpdate(irACValue, redACValue, beatDetected);
            } else if (pulseState == PULSEOXIMETER_STATE_DETECTING) {
                pulseState = PULSEOXIMETER_STATE_IDLE;
                spO2CalculatorReset();
            }

            //if (beatDetected && onBeatDetected) {
            //    onBeatDetected();
            //}
            if(--index < 0) {
                index = RINGBUFFER_SIZE - 1;
            }
        }
    }
   
    function checkCurrentBias(){
        if (control.millis() - tsLastBiasCheck > CURRENT_ADJUSTMENT_PERIOD_MS) {
            let changed = false;
            if (irDCdcw - redDCdcw > 70000 && redLedCurrentIndex < MAX30100_LED_CURR_50MA) {
                ++redLedCurrentIndex;
                changed = true;
            } else if (redDCdcw - irDCdcw > 70000 && redLedCurrentIndex > 0) {
                --redLedCurrentIndex;
                changed = true;
            }

            if (changed) {
                setLedsCurrent(irLedCurrent, redLedCurrentIndex);
                tsLastCurrentAdjustment = control.millis();

                //if (debuggingMode != PULSEOXIMETER_DEBUGGINGMODE_NONE) {
                    //Serial.print("I:");
                    //Serial.println(redLedCurrentIndex);
                //}
            }

            tsLastBiasCheck = control.millis();
        }
    }

    //% subcategory="SpO2"
    //% blockId=SpO2Temp
    //% block="SpO2 Temp [C]"
    export function SpO2Temp(): number {
        SpO2InitTemp ();
        let tempInteger = i2cread(MAX30100_I2C_ADDRESS, MAX30100_REG_TEMPERATURE_DATA_INT);
        let tempFrac = i2cread(MAX30100_I2C_ADDRESS, MAX30100_REG_TEMPERATURE_DATA_FRAC);
    
        return tempFrac * 0.0625 + tempInteger;
    }    

    //% subcategory="SpO2"
    //% blockId=initalSpO2Temp
    //% block="Init SpO2 Temp"
    export function SpO2InitTemp () {
    
        let modeConfig = i2cread(MAX30100_I2C_ADDRESS, MAX30100_REG_MODE_CONFIGURATION);
        modeConfig |= MAX30100_MC_TEMP_EN;
    
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_REG_MODE_CONFIGURATION, modeConfig);
    }   


    //% subcategory="SpO2"
    //% blockId=HRValue
    //% block="HR[b/m]"
    export function HRValue(): number {
        //return HeartRate;
        return HeartRate / 3;
    }

    //% subcategory="SpO2"
    //% blockId=SpO2Value
    //% block="SpO2[percent]"
    export function SpO2Value(): number {
        return spO2;
    }

    //% subcategory="SpO2"
    //% blockId=measureSpO2
    //% block="Measure SpO2"
    export function measureSpO2 () {
        let t = control.millis();

        while(control.millis() - t < SPO2_MEASUREMENT_TIME_MS*2) {
           SPO2update();
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
    
        setMode(MAX30100_MODE_SPO2_HR);
        setLedsCurrent(irLedCurrent, redLedCurrentIndex);
        resetFifo();
        //i2creads(MAX30100_I2C_ADDRESS, MAX30100_REG_MODE_CONFIGURATION, 1);
        //basic.showNumber(readbuf[0]+5);
        //basic.showNumber(i2cread(MAX30100_I2C_ADDRESS, MAX30100_REG_MODE_CONFIGURATION)+5);
    }

/*
    //% subcategory="SpO2"
    //% blockId=IRValue
    //% block="IRValue"
    export function IRValue(): number {
        return rawIRValue;
    }

    //% subcategory="SpO2"
    //% blockId=RedValue
    //% block="RedValue"
    export function RedValue(): number {
        return rawRedValue;
    }

    //% subcategory="SpO2"
    //% blockId=irACValue
    //% block="irACValue"
    export function f_irACValue(): number {
        return irACValue;
    }

    //% subcategory="SpO2"
    //% blockId=redACValue
    //% block="redACValue"
    export function f_redACValue(): number {
        return redACValue;
    }

    //% subcategory="SpO2"
    //% blockId=filteredPulseValue
    //% block="filteredPulseValue"
    export function f_filteredPulseValue(): number {
        return filteredPulseValue;
    }

    //% subcategory="SpO2"
    //% blockId=irDCdcw
    //% block="irDCdcw"
    export function f_irDCdcw(): number {
        return irDCdcw;
    }

    //% subcategory="SpO2"
    //% blockId=redDCdcw
    //% block="redDCdcw"
    export function f_redDCdcw(): number {
        return redDCdcw;
    }

    //% subcategory="SpO2"
    //% blockId=filterV1
    //% block="filterV1"
    export function f_filterV1(): number {
        return filterV1;
    }
*/


 





    //% subcategory="LED"
    //% blockId=ledRGB
    //% block="RGB 0-240 %value"
    //% value.min=0 value.max=240 value.defl=0
    export function HSV2RGB (value: number) {
        let red = 1
        let green = 1
        let blue = 1
        let h = value / 60
        let f = value % 60 / 60
        if (h < 1) {
            red = 0
            green = f
            blue = 1
        } else if (h < 2) {
            red = 0
            green = 1
            blue = 1 - f
        } else if (h < 3) {
            red = f
            green = 1
            blue = 0
        } else if (h < 4) {
            red = 1
            green = 1 - f
            blue = 0
        } else {
            red = 1
            green = 0
            blue = 0
        }
        LedRed(red * 1023)
        LedGreen(green * 1023)
        LedBlue(blue * 1023)
    }

    //% subcategory="LED"
    //% blockId=ledB
    //% block="Blue 0-1023 %value"
    //% value.min=0 value.max=1023 value.defl=0
    export function LedBlue(value: number) {
        pins.analogWritePin(AnalogPin.P1, value)
    }

    //% subcategory="LED"
    //% blockId=ledG
    //% block="Green 0-1023 %value"
    //% value.min=0 value.max=1023 value.defl=0
    export function LedGreen(value: number) {
        pins.analogWritePin(AnalogPin.P2, value)
    }

    //% subcategory="LED"
    //% blockId=ledR
    //% block="Red 0-1023 %value"
    //% value.min=0 value.max=1023 value.defl=0
    export function LedRed(value: number) {
        pins.analogWritePin(AnalogPin.P0, value)
    }
}





