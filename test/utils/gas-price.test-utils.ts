import { GasPriceResponseDto } from '@/modules/gas-price/dtos/gas-price.dto';

export const validateGasPriceResponse = (response: GasPriceResponseDto) => {
  // Verify response structure
  expect(response).toHaveProperty('gasPrice');
  expect(typeof response.gasPrice).toBe('string');
  expect(response.gasPrice).toMatch(/^0x[0-9a-fA-F]+$/);

  // Verify gas price is a valid number (convert to decimal from hex)
  const gasPriceDecimal = BigInt(response.gasPrice);
  expect(gasPriceDecimal).toBeGreaterThan(0);
};

export const mockGasPriceResponse: GasPriceResponseDto = {
  gasPrice: '0x19',
}; 