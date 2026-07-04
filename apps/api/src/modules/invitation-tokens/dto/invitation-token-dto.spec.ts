import { InvitationTokenContext } from '@chamuco/shared-types';
import { InvitationTokenCreateResponseDto } from './invitation-token-create-response.dto';
import { InvitationTokenResolveResponseDto } from './invitation-token-resolve-response.dto';
import { InvitationTokenRedeemResponseDto } from './invitation-token-redeem-response.dto';

describe('Invitation token DTOs — default values', () => {
  it('InvitationTokenCreateResponseDto has correct defaults', () => {
    const dto = new InvitationTokenCreateResponseDto();
    expect(dto.token).toBe('');
    expect(dto.url).toBe('');
    expect(dto.isActive).toBe(true);
  });

  it('InvitationTokenResolveResponseDto has correct defaults', () => {
    const dto = new InvitationTokenResolveResponseDto();
    expect(dto.token).toBe('');
    expect(dto.contextType).toBe(InvitationTokenContext.REFERRAL);
    expect(dto.isActive).toBe(true);
  });

  it('InvitationTokenRedeemResponseDto has correct defaults', () => {
    const dto = new InvitationTokenRedeemResponseDto();
    expect(dto.outcome).toBe('INVITED');
    expect(dto.contextType).toBe(InvitationTokenContext.REFERRAL);
  });
});
