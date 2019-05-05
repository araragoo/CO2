//% weight=5 color=#0fbc11 icon="\uf112"
namespace Motor {

    // モータアドレス
    const DRV_ADR1 = 0x64  // DRV8830のI2Cアドレス A1 = open,  A0 = open
    const DRV_ADR2 = 0x65  // DRV8830のI2Cアドレス A1 = open,  A0 = 1
    const CTR_ADR  = 0x00  // CONTROLレジスタのサブアドレス
    const FLT_ADR  = 0x01  // FAULTレジスタのアドレス

    // ブリッジ制御
    const M_STANBY  = 0 //B00   // スタンバイ   
    const M_REVERSE = 1 //B01   // 逆転
    const M_NORMAL  = 2 //B10   // 正転
    const M_BRAKE   = 3 //B11   // ブレーキ

    const DRV_MIN      =    0 //  0V
    const DRV_MAX      =  100 //  3Vmax
    const DRV_MIN_B    =    0 //  0lsb
    const DRV_MAX_B    =   37 //  6-37lsb : 0.48-5.06V   3Vmax -> (3.0-0.48)/(5.06-0.48)*(63-6)+6 = 37lsb
    const DRV_MAXMAX_B = 0x3F

    // サーボ
    const PCA9685_ADDRESS = 0x40
    const MODE1 = 0x00
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06

    const PWM_FREQUENCY = 50              //50Hz 20ms
    const PWM_MAX       = 2400*4096/20000 //2.4ms
    const PWM_MIN       = 500*4096/20000  //0.5ms
    const PWM_MAX_B     = 4095            //4095lsb
    const PWM_MIN_B     = 0               //   0lsb

    const DEGREE_MIN = -90 //-90deg.
    const DEGREE_MAX =  90 // 90deg.
    const LED_MIN    =   0 //  0V
    const LED_MAX    = 100 //3.3V

    let initialized = false

    function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = value;
        pins.i2cWriteBuffer(addr, buf);
    }

    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function driveM(channel: number, voltage: number) {
        
        pins.i2cWriteNumber(channel, channel, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(channel, NumberFormat.UInt8BE);
        return val;
    }

    //% blockId=setDrive block="Drive Right:0 Left:1 %channel|BWD<=>FWD:-100<=>100 %voltage"
    //% weight=85
    //% channel.min=0 channel.max=1
    //% voltage.min=-100 voltage.max=100
    export function Drive(channel: number,voltage: number): void {
        driveM(channel, voltage);
    }

    function initPCA9685(): void {
        i2cwrite(PCA9685_ADDRESS, MODE1, 0x00)
        setFreq(50);
        setPwm(0, 0, 4095);
        for (let idx = 1; idx < 16; idx++) {
            setPwm(idx, 0, 0);
        }
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        freq *= 0.9;  // Correct for overshoot in the frequency setting (see issue #11).
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval; //Math.Floor(prescaleval + 0.5);
        let oldmode = i2cread(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cwrite(PCA9685_ADDRESS, MODE1, newmode); // go to sleep
        i2cwrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }

    //% blockId=setServo block="Servo LowR:0 LowL:1 HighR:2 HighL:3 %channel|degree:-45〜45 %degree"
    //% weight=85
    //% channel.min=0 channel.max=3
    //% degree.min=-45 degree.max=45
    export function Servo(channel: number,degree: number): void {
        if (!initialized) {
            initPCA9685();
        }
        let val = degree;
        val = (val-DEGREE_MIN) * (PWM_MAX-PWM_MIN) / (DEGREE_MAX-DEGREE_MIN);
        setPwm(channel+4, 0, val);
    }

    //% blockId=setLED block="LED Red:0 Yellow:1 Green:2 Blue:3 %channel|voltage:0〜100 %voltage"
    //% weight=85
    //% channel.min=0 channel.max=3
    //% voltage.min=0 voltage.max=100
    export function LED(channel: number,voltage: number): void {
        if (!initialized) {
            initPCA9685();
        }
        let val = voltage;
        val = (val-LED_MIN) * (PWM_MAX-PWM_MIN) / (LED_MAX-LED_MIN);
        setPwm(channel, 0, val);
    }
} 
