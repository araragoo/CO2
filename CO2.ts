// https://github.com/araragoo/CO2

//% weight=5 color=#0fbc11 icon="\uf112" block="CO2"
namespace CO2 {

    let CO2data = 400
    let buffer: Buffer = null
    let buf  = control.createBuffer(9)
    let buf0 = control.createBuffer(9)

    //  subcategory="CO2"
    //% blockId=initalCO2
    //% block="Init CO2"
    export function initCO2 () {
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

    //  subcategory="CO2"
    //% blockId=measureCO2
    //% block="CO2[ppm]"
    export function measuredValue(): number {

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

    //  subcategory="CO2"
    //% blockId=setOffset
    //% block="Set CO2 value as 400ppm"
    export function setOffset () {

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







    const MAX30100_INT_STATUS   = 0x00  // Which interrupts are tripped
    const MAX30100_INT_ENABLE   = 0x01  // Which interrupts are active
    const MAX30100_FIFO_WR_PTR  = 0x02  // Where data is being written
    const MAX30100_OVRFLOW_CTR  = 0x03  // Number of lost samples
    const MAX30100_FIFO_RD_PTR  = 0x04  // Where to read from
    const MAX30100_FIFO_DATA    = 0x05  // Ouput data buffer
    const MAX30100_MODE_CONFIG  = 0x06  // Control register
    const MAX30100_SPO2_CONFIG  = 0x07  // Oximetry settings
    const MAX30100_LED_CONFIG   = 0x09  // Pulse width and power of LEDs
    const MAX30100_TEMP_INTG    = 0x16  // Temperature value, whole number
    const MAX30100_TEMP_FRAC    = 0x17  // Temperature value, fraction
    const MAX30100_REV_ID       = 0xFE  // Part revision
    const MAX30100_PART_ID      = 0xFF  // Part ID, normally 0x11

    const MAX30100_I2C_ADDRESS  = 0xAE; //0x57 I2C address of the MAX30100 device

    const PULSE_WIDTH = {
        200: 0,
        400: 1,
        800: 2,
       1600: 3,
    }
    
    const SAMPLE_RATE = {
        50: 0,
       100: 1,
       167: 2,
       200: 3,
       400: 4,
       600: 5,
       800: 6,
      1000: 7,
    }
    
    let LED_CURRENT = [
        0,
      4.4,
      7.6,
     11.0,
     14.2,
     17.4,
     20.8,
     24.0,
     27.1,
     30.6,
     33.8,
     37.0,
     40.2,
     43.6,
     46.8,
     50.0
    ]
    const LED_CURRENT_NUM = 16;

    let INTERRUPT_SPO2 = 0;
    let INTERRUPT_HR = 1;
    let INTERRUPT_TEMP = 2;
    let INTERRUPT_FIFO = 3;
    
    let MODE_HR = 0x02;
    let MODE_SPO2 = 0x03;
  
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

    function twos_complement(val: number, bits: number) {
        if ((val & (1 << (bits - 1))) != 0) {
            val = val - (1 << bits)
        }
        return val
    }

    function MAX30100_init() {
    
        let mode = MODE_HR;
        let sample_rate = 100;
        let led_current_red = 11.0;
        let led_current_ir = 11.0;
        let pulse_width = 1600;
        let max_buffer_len = 10000;
    }

    function red()  {
        return buffer_red[0];
    }

    function ir()  {
        return buffer_ir[0];
    }

    function get_valid(current: number) {
        for (let index = 0; index < LED_CURRENT_NUM; index++) {
            if(current <= LED_CURRENT[index]) {
                return index;
            }
        }
        return LED_CURRENT_NUM - 1;
    }       

    function set_led_current() {
        let led_current_red = 11.0;
        let led_current_ir = 11.0;
        led_current_red = get_valid(led_current_red)
        led_current_ir = get_valid(led_current_ir)
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_LED_CONFIG, (led_current_red << 4) | led_current_ir);
    }
    
    function set_mode(mode: number) {
        let reg = i2cread(MAX30100_I2C_ADDRESS, MAX30100_MODE_CONFIG)
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_MODE_CONFIG, reg & 0x74) // mask the SHDN bit
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_MODE_CONFIG, reg | mode);
    }

    function enable_spo2() {
        set_mode(MODE_SPO2)
    }

    function  disable_spo2() {
        set_mode(MODE_HR)
    }
    
    function set_spo_config() {
        let sample_rate = 100;
        let pulse_width = 1600;
        let reg = i2cread(MAX30100_I2C_ADDRESS, MAX30100_SPO2_CONFIG)
        reg = reg & 0xFC  // Set LED pulsewidth to 00
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_SPO2_CONFIG, reg | pulse_width);
    }

    function enable_interrupt(interrupt_type: number) {
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_INT_ENABLE, (interrupt_type + 1)<<4);
        i2cread(MAX30100_I2C_ADDRESS, MAX30100_INT_STATUS);
    }

    function get_number_of_samples() {
        let write_ptr = i2cread(MAX30100_I2C_ADDRESS, MAX30100_FIFO_WR_PTR);
        let read_ptr = i2cread(MAX30100_I2C_ADDRESS, MAX30100_FIFO_RD_PTR);
        return Math.abs(16+write_ptr - read_ptr) % 16;
    }

    let buffer_red: number[] = [];
    let buffer_ir: number[] = [];
    const MAX30100_MAX_BUFFER_LEN = 10000;

    function read_sensor() {
        pins.i2cWriteNumber(MAX30100_I2C_ADDRESS, MAX30100_FIFO_DATA, NumberFormat.UInt8BE);
        let nums: number[] = []
        nums[0] = pins.i2cReadNumber(MAX30100_I2C_ADDRESS, NumberFormat.UInt8BE, true);
        nums[1] = pins.i2cReadNumber(MAX30100_I2C_ADDRESS, NumberFormat.UInt8BE, true);
        nums[2] = pins.i2cReadNumber(MAX30100_I2C_ADDRESS, NumberFormat.UInt8BE, true);
        nums[3] = pins.i2cReadNumber(MAX30100_I2C_ADDRESS, NumberFormat.UInt8BE, false);
        for (let index = 0; index <= MAX30100_MAX_BUFFER_LEN-2; index++) {
            buffer_ir[index+1] = buffer_ir[index];
            buffer_red[index+1] = buffer_red[index];
        }
        buffer_ir[0] = nums[0]<<8 | nums[1];
        buffer_red[0] = nums[2]<<8 | nums[3];
    }

    function shutdown() {
        let reg = i2cread(MAX30100_I2C_ADDRESS, MAX30100_MODE_CONFIG);
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_MODE_CONFIG, reg | 0x80);
    }

    function reset() {
        let reg = i2cread(MAX30100_I2C_ADDRESS, MAX30100_MODE_CONFIG);
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_MODE_CONFIG, reg | 0x40);
    }
        
    function refresh_temperature() {
        let reg = i2cread(MAX30100_I2C_ADDRESS, MAX30100_MODE_CONFIG);
        i2cwrite(MAX30100_I2C_ADDRESS, MAX30100_MODE_CONFIG, reg | (1 << 3));
    }

    function get_temperature() {
        let intg = twos_complement(i2cread(MAX30100_I2C_ADDRESS, MAX30100_TEMP_INTG), 8);
        let frac = i2cread(MAX30100_I2C_ADDRESS, MAX30100_TEMP_FRAC);
        return intg + (frac * 0.0625);
    }

    function get_rev_id() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_REV_ID);
    }

    function get_part_id() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_PART_ID);
    }

    //get_registers
    function getINT_STATUS() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_INT_STATUS));
    }
    function getINT_ENABLE() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_INT_ENABLE));
    }
    function getFIFO_WR_PTR() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_FIFO_WR_PTR));
    }
    function getOVRFLOW_CTR() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_OVRFLOW_CTR));
    }
    function getFIFO_RD_PTR() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_FIFO_RD_PTR));
    }
    function getFIFO_DATA() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_FIFO_DATA));
    }
    function getMODE_CONFIG() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_MODE_CONFIG));
    }
    function getSPO2_CONFIG() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_SPO2_CONFIG));
    }
    function getLED_CONFIG() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_LED_CONFIG));
    }
    function getTEMP_INTG() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_TEMP_INTG));
    }
    function getTEMP_FRAC() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_TEMP_FRAC));
    }
    function getREV_ID() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_REV_ID));
    }
    function getPART_ID() {
        return (i2cread(MAX30100_I2C_ADDRESS, MAX30100_PART_ID));
    }













    function bitMask(reg: number, mask: number, thing: number){
        let originalContents = i2cread(MAX30105_ADDRESS, reg);
        originalContents = originalContents & mask;
      i2cwrite(MAX30105_ADDRESS, reg, originalContents | thing);
    }




    function softReset() {
        bitMask(MAX30105_MODECONFIG, MAX30105_RESET_MASK, MAX30105_RESET);
        basic.pause(100);
    }

    function setFIFOAverage(numberOfSamples: number) {
        bitMask(MAX30105_FIFOCONFIG, MAX30105_SAMPLEAVG_MASK, numberOfSamples);
    }

    function setFIFOAlmostFull(numberOfSamples: number) {
        bitMask(MAX30105_FIFOCONFIG, MAX30105_A_FULL_MASK, numberOfSamples);
    }

    function enableFIFORollover() {
        bitMask(MAX30105_FIFOCONFIG, MAX30105_ROLLOVER_MASK, MAX30105_ROLLOVER_ENABLE);
    }

    function setLEDMode(mode: number) {
        activeDiodes = mode - 1;
        bitMask(MAX30105_MODECONFIG, MAX30105_MODE_MASK, mode);
    }

    function setADCRange(adcRange: number) {
        bitMask(MAX30105_PARTICLECONFIG, MAX30105_ADCRANGE_MASK, adcRange);
    }

    function setSampleRate(sampleRate: number) {
        bitMask(MAX30105_PARTICLECONFIG, MAX30105_SAMPLERATE_MASK, sampleRate);
    }

    function setPulseWidth(pulseWidth: number) {
        bitMask(MAX30105_PARTICLECONFIG, MAX30105_PULSEWIDTH_MASK, pulseWidth);
    }

    function setPulseAmplitudeRed(amplitude: number) {
        i2cwrite(MAX30105_ADDRESS, MAX30105_LED1_PULSEAMP, amplitude);
    }

    function setPulseAmplitudeIR(amplitude: number) {
        i2cwrite(MAX30105_ADDRESS, MAX30105_LED2_PULSEAMP, amplitude);
    }

    function enableSlot(slotNumber: number, device: number) {

      switch (slotNumber) {
        case (1):
          bitMask(MAX30105_MULTILEDCONFIG1, MAX30105_SLOT1_MASK, device);
          break;
        case (2):
          bitMask(MAX30105_MULTILEDCONFIG1, MAX30105_SLOT2_MASK, device << 4);
          break;
        case (3):
          bitMask(MAX30105_MULTILEDCONFIG2, MAX30105_SLOT3_MASK, device);
          break;
        case (4):
          bitMask(MAX30105_MULTILEDCONFIG2, MAX30105_SLOT4_MASK, device << 4);
          break;
        default:
          break;
      }
    }

    function clearFIFO() {
      i2cwrite(MAX30105_ADDRESS, MAX30105_FIFOWRITEPTR, 0);
      i2cwrite(MAX30105_ADDRESS, MAX30105_FIFOOVERFLOW, 0);
      i2cwrite(MAX30105_ADDRESS, MAX30105_FIFOREADPTR, 0);
    }

    function particle_setup(powerLevel: number, sampleAverage: number, ledMode: number, sampleRate: number, pulseWidth: number, adcRange: number) {
        softReset();
        if (sampleAverage == 1) setFIFOAverage(MAX30105_SAMPLEAVG_1); //No averaging per FIFO record
        else if (sampleAverage == 2) setFIFOAverage(MAX30105_SAMPLEAVG_2);
        else if (sampleAverage == 4) setFIFOAverage(MAX30105_SAMPLEAVG_4);
        else if (sampleAverage == 8) setFIFOAverage(MAX30105_SAMPLEAVG_8);
        else if (sampleAverage == 16) setFIFOAverage(MAX30105_SAMPLEAVG_16);
        else if (sampleAverage == 32) setFIFOAverage(MAX30105_SAMPLEAVG_32);
        else setFIFOAverage(MAX30105_SAMPLEAVG_4);

        //setFIFOAlmostFull(2); //Set to 30 samples to trigger an 'Almost Full' interrupt
        enableFIFORollover(); //Allow FIFO to wrap/roll over

        if (ledMode == 2) setLEDMode(MAX30105_MODE_REDIRONLY); //Red and IR
        else setLEDMode(MAX30105_MODE_REDONLY); //Red only
        activeDiodes = ledMode; //Used to control how many uint8_ts to read from FIFO buffer

        if(adcRange < 4096) setADCRange(MAX30105_ADCRANGE_2048); //7.81pA per LSB
        else if(adcRange < 8192) setADCRange(MAX30105_ADCRANGE_4096); //15.63pA per LSB
        else if(adcRange < 16384) setADCRange(MAX30105_ADCRANGE_8192); //31.25pA per LSB
        else if(adcRange == 16384) setADCRange(MAX30105_ADCRANGE_16384); //62.5pA per LSB
        else setADCRange(MAX30105_ADCRANGE_2048);

        if (sampleRate < 100) setSampleRate(MAX30105_SAMPLERATE_50); //Take 50 samples per second
        else if (sampleRate < 200) setSampleRate(MAX30105_SAMPLERATE_100);
        else if (sampleRate < 400) setSampleRate(MAX30105_SAMPLERATE_200);
        else if (sampleRate < 800) setSampleRate(MAX30105_SAMPLERATE_400);
        else if (sampleRate < 1000) setSampleRate(MAX30105_SAMPLERATE_800);
        else if (sampleRate < 1600) setSampleRate(MAX30105_SAMPLERATE_1000);
        else if (sampleRate < 3200) setSampleRate(MAX30105_SAMPLERATE_1600);
        else if (sampleRate == 3200) setSampleRate(MAX30105_SAMPLERATE_3200);
        else setSampleRate(MAX30105_SAMPLERATE_50);

        if (pulseWidth < 118) setPulseWidth(MAX30105_PULSEWIDTH_69); //Page 26, Gets us 15 bit resolution
        else if (pulseWidth < 215) setPulseWidth(MAX30105_PULSEWIDTH_118); //16 bit resolution
        else if (pulseWidth < 411) setPulseWidth(MAX30105_PULSEWIDTH_215); //17 bit resolution
        else if (pulseWidth == 411) setPulseWidth(MAX30105_PULSEWIDTH_411); //18 bit resolution
        else setPulseWidth(MAX30105_PULSEWIDTH_69);

        //LED Pulse Amplitude Configuration
        //-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        //Default is 0x1F which gets us 6.4mA
        //powerLevel = 0x02, 0.4mA - Presence detection of ~4 inch
        //powerLevel = 0x1F, 6.4mA - Presence detection of ~8 inch
        //powerLevel = 0x7F, 25.4mA - Presence detection of ~8 inch
        //powerLevel = 0xFF, 50.0mA - Presence detection of ~12 inch

        setPulseAmplitudeRed(powerLevel);
        setPulseAmplitudeIR(powerLevel);

        enableSlot(1, SLOT_RED_LED);
        if (ledMode > 1) enableSlot(2, SLOT_IR_LED);
        //enableSlot(1, SLOT_RED_PILOT);
        //enableSlot(2, SLOT_IR_PILOT);
        //enableSlot(3, SLOT_GREEN_PILOT);

        clearFIFO(); //Reset the FIFO before we begin checking the sensor
    }
    
    let senseRed=0;
    let senseIR=0;
    let senseGreen;
    let senseHead=0;
    let senseTail;

    function getWritePointer() {
        return (i2cread(MAX30105_ADDRESS, MAX30105_FIFOWRITEPTR));
    }
    
    function getReadPointer() {
        return (i2cread(MAX30105_ADDRESS, MAX30105_FIFOREADPTR));
    }

    function check() {
      //Until FIFO_RD_PTR = FIFO_WR_PTR
  
      let readPointer = getReadPointer();
      let writePointer = getWritePointer();
      let numberOfSamples = 0;
    
      if (readPointer != writePointer) {
        numberOfSamples = writePointer - readPointer;
        if (numberOfSamples < 0) numberOfSamples += I2C_BUFFER_LENGTH; //Wrap condition
        let bytesLeftToRead = numberOfSamples * activeDiodes * 3;
        while (bytesLeftToRead > 0) {            
          let toGet = activeDiodes * 3;   
          //i2c.requestFrom(MAX30105_ADDRESS, toGet);
          while(toGet > 0) {
            let temp[9]; //Array of 9 uint8_ts that we will convert into longs
            let temp2[4];
            let tempLong;
            i2c.readRegister(MAX30105_ADDRESS, MAX30105_FIFODATA, temp, toGet);
            senseHead++; //Advance the head of the storage struct
            senseHead %= STORAGE_SIZE; //Wrap condition
            for (let led = 0; led < activeDiodes; led++)
            {
                uint8_t checkOffset = led * 3;
                temp2[3] = 0;
                temp2[0] = temp[2 + checkOffset];
                temp2[1] = temp[1 + checkOffset];
                temp2[2] = temp[checkOffset];
                memcpy(&tempLong, temp2, sizeof(tempLong)); //tempLong is 4 bytes, we only need 3
                tempLong &= 0x3FFFF;
                switch (led)
                {
                    case 0:
                        sense.red[sense.head] = tempLong;//Long;//Store this reading into the sense array
                        break;
                    case 1:
                        sense.IR[sense.head] = tempLong;
                        break;
                    case 2:
                        sense.green[sense.head] = tempLong;
                        break;
                    default:
                        break;
                }
            }
            bytesLeftToRead -= toGet;
            toGet -= activeDiodes * 3;
          }
        } //End while (bytesLeftToRead > 0)
      } //End readPtr != writePtr
      return (numberOfSamples); //Let the world know how much new data we found
    }
        
    function getRed() {
        if(safeCheck(250)){
            return senseRed;//[sense.head];
        }
        return 0;
    }

    function getIR() {
        if(safeCheck(250)){
            return senseIR;//[sense.head];
        }
        return 0;
    }

    function safeCheck(maxTimeToCheck: number){
        let markTime = input.runningTime();
        while(1){
            if(input.runningTime() - markTime > maxTimeToCheck){
                return(false);
            }
            if(check() == true){ //We found new data!
                return(true);
            }
            basic.pause(1);
        }
        return(false);        
    }

	/**
	* Initializes the gator:particle sensor, must be called on power up
	*/	
	//% weight=30 
	//% blockId="gatorParticle_begin" 
	//% block="initialize gator:Particle sensor"
	export function begin(){
		particle_setup(0x1F, 4, 2, 400, 411, 4096);
		return
	}
		
	/**
	* Reads either the Red or Infrared detection channels
	*/
	//% weight=29 
	//% blockId="gatorParticle_color" 
	//% block="get Red:1 Infrared:2 %LEDToRead value"
	export function color(LEDToRead: number): number{
        let colorValue = 0;
		switch(LEDToRead)
		{
			case 1:
				colorValue = getRed();
				break;
			case 2:
				colorValue = getIR();
				break;
		}
	   	return colorValue;
	}
	
	/**
	* Set which LED's we want the sensor to update and read.
	*/	
	//% weight=28
	//% blockId="gatorParticle_setReadMode"
	//% block="set LED mode to read Red:2 Red&Infrared:3 %LEDMode"
	//% shim=gatorParticle::setReadMode
	export function setReadMode(LEDMode: number)
	{
		return
	}

	/**
	* Set the amplitude of either Red or Infrared LED
	*/	
	//% weight=27
	//% blockId="gatorParticle_setAmplitude"
	//% block="change strength of Red:1 Infrared:2 %LEDToRead | to %myBrightness"
	//% advanced=true
	export function setAmplitude(LEDToRead: number, myBrightness: number)
	{
		return
	}
	
	/**
	* Grab the heartbeat from the sensor in either beats per minute, or an average of the last 4 BPM readings.
	*/
	//% weight=26
	//% blockId="gatorParticle_heartbeat"
	//% block="detect heartbeat in BPM:0 AVG:1 %HeartbeatType"
	export function heartbeat(HeartbeatType: number): number
	{
		return 0
	}
}

