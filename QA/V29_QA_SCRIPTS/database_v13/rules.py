num=lambda v:isinstance(v,(int,float)) and not isinstance(v,bool)
def rule(sheet,r):
    if 'ETAP-protected' in str(r.get('Data Status') or ''): return False
    if sheet=='CABLES':
        if num(r.get('R1')) and num(r.get('X1')): return r['R1']>=0 and r['X1']>=0 and (r['R1']>0 or r['X1']>0)
        R=[r.get(k) for k in ('Resistance Numeric Ω/kft','Rac Ω/kft')]; X=[r.get(k) for k in ('Reactance Numeric Ω/kft','X Ω/kft')]
        return any(num(v) and v>0 for v in R) and any(num(v) and v>=0 for v in X)
    if sheet=='HV_BREAKERS': return r.get('Standard')!='IEC/IEEE'
    if sheet=='FUSES': return num(r.get('Interrupting kA (Source)'))
    return True
