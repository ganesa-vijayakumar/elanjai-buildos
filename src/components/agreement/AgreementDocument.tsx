import { useRef } from 'react'
import { Button } from '../ui/button'
import { Download, ArrowLeft, Printer } from '@phosphor-icons/react'
import { Card } from '../ui/card'
import { format } from 'date-fns'
import { Quotation, Project } from '@/lib/types'
import { StagesConfiguration } from '../ConstructionStagesConfig'

interface AgreementDocumentProps {
    quotation: Quotation
    stagesConfig: StagesConfiguration
    onBack: () => void
}

export function AgreementDocument({ quotation, stagesConfig, onBack }: AgreementDocumentProps) {
    const documentRef = useRef<HTMLDivElement>(null)
    const today = format(new Date(), 'dd/MM/yyyy')

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const getPackageSpecifications = () => {
        // These strings match the sample agreement but select based on package intent
        // We default to 'standard' like in the sample since strict mapping might be complex
        // In a real app, this would come fully mapped from materialData.ts.
        // Here we use the structure from sample-agreement.md
        return {
            basement: [
                `Basement level of building will be 3'0" from the existing NGL.`,
                `Car parking will be 1'6" from NGL.`,
                `RCC 1:1½:3 in Column, beams, Lintel and Roof slab 5" Machine jelly.`,
                `3" thick for loft (RCC)`
            ],
            brickWork: [
                `9" Brick work in CM 1:5 using well burnt stock brick in plinth beam above to roof slab bottom.`,
                `Inner partition 4.5" Brick work in CM 1:5 using well burnt stock brick in roof slab bottom.`,
                `Parapet Wall 4.5" Brick work in CM 1:5 using well burnt stock brick in terrace floor.`
            ],
            plastering: [
                `Plastering towelling, under side of slab, beam columns etc., in CM 1:3, ½" thick finished smooth with sponges.`,
                `Plastering interior faces of walls and ceiling with CM 1:4, ¾" thick finished smooth with sponge true to plumb.`,
                `Plastering outer faces of walls with CM 1:4, ¾" thick finished smooth with sponge true to plumb.`
            ],
            flooring: [
                `Flooring of all rooms will be of Vitrified Tile (4'x2') @ rate of Rs.50/sq.ft.`,
                `Toilet flooring and wall tiles (7'0"ht) will be joint free Ceramic tiles of any size with a basic rate of Rs.45/sq.ft. And the floor should be anti-skid tiles with a basic rate of Rs.40/sq.ft.`,
                `Staircase flooring will be of anti-skid tiles with a basic rate of Rs.40/sq.ft.`
            ],
            joinery: [
                `Main door frame shall be First class Teak Wood shall be 5"x4" in size.`,
                `Bed room door frame shall be 3"x2½" in size.`,
                `Bed room door shall be First quality country woods frames with flush shutters.`,
                `Toilet doors will be of PVC doors.`,
                `Window frames and shutters open type or sliding will be UPVC.`,
                `Ventilator frames 2"x2" in size.`,
                `All hinges and fittings for internal doors will be of stainless steel.`
            ],
            painting: [
                `One coat of white cement and two coats of exterior emulsion (Ace) paint for outside walls.`,
                `Two Coats of Putty a coat of primer and two coats of emulsion paint (Tractor) over for inside wall & two coat ceiling white surface.`,
                `Two coats of synthetic enamel paint over one coat of primer for grills.`
            ],
            electrical: [
                `The wiring shall be carried out with PVC insulated copper wires of Orbit or similar brand.`,
                `Power supply for Air conditioner shall be wired with 4 sq.mm copper wire and provided with switch sockets and plugs of 30 amps rating.`,
                `GM, Orbit modular switches will be used.`,
                `Telephone, TV point and AC point will be provided for all the bedrooms.`,
                `Inverter line for a light and a fan in each room and for a light in toilets will be provided.`,
                `Toilet will have one 15amp & one 5amp plug point.`
            ],
            plumbing: [
                `Hot water lines will be of CPVC pipes with a hot water connection for toilet.`,
                `European water closets of Parryware Indus make and other ceramic fittings will also be of Parryware Indus make shall be used and drain connection shall be through raised floor.`,
                `All PVC pipes will be of Ashirvad or Finolex make.`,
                `Bath rooms to have 3 in 1 wall mixer with a normal shower and a hand shower.`,
                `Toilet to have health faucet.`
            ]
        }
    }
    const specs = getPackageSpecifications()


    const getDocumentStyles = () => `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
      
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Times New Roman', serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #000;
        background: #fff;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        margin: 0 auto;
        background: white;
      }
      .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
      .title { font-size: 14pt; margin-bottom: 5px; text-decoration: underline; }
      .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-decoration: underline; }
      .schedule-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
      .content-block { margin-bottom: 15px; text-align: justify; }
      .party-block { margin-bottom: 15px; }
      .party-label { font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
      
      table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
      th, td { border: 1px solid #000; padding: 4px 8px; font-size: 10pt; }
      th { font-weight: bold; text-align: center; background-color: #f0f0f0; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      
      .list-item { margin-left: 20px; text-indent: -20px; margin-bottom: 3px; }
      .sub-list-item { margin-left: 20px; }
      
      .signatures { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
      .signature-block { width: 40%; text-align: center; border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; }
      
      @media print {
        body { background: none; }
        .page { width: 100%; margin: 0; padding: 15mm; }
        .no-print { display: none; }
      }
    </style>
  `

    const handlePrint = () => {
        if (!documentRef.current) return

        const printWindow = window.open('', '_blank', 'width=900,height=800')
        if (printWindow) {
            printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Agreement - ${quotation.clientName}</title>
            ${getDocumentStyles()}
          </head>
          <body>
            <div class="page">
              ${documentRef.current.innerHTML}
            </div>
          </body>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </html>
      `)
            printWindow.document.close()
        }
    }

    // Cost calculations
    const totalCost = stagesConfig.projectCost
    // Round off logic from sample (just an example, keeping simple for now)
    const roundOffAmount = Math.floor(totalCost / 1000) * 1000

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-6 no-print">
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    <ArrowLeft />
                    Back to Configuration
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} className="bg-red-600 hover:bg-red-700">
                        <Printer className="mr-2" />
                        Print / Download PDF
                    </Button>
                </div>
            </div>

            <Card className="p-8 md:p-12 bg-white shadow-lg overflow-hidden">
                <div ref={documentRef} className="agreement-content font-serif text-sm md:text-base leading-relaxed text-black">

                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h1 style={{ fontWeight: 'bold', fontSize: '16pt', marginBottom: '10px' }}>AGREEMENT BETWEEN CONTRACTOR AND OWNER FOR CONSTRUCTION OF BUILDING</h1>
                        <p><strong>Date:</strong> {today}</p>
                        <p><strong>Location:</strong> {quotation.location.split(',')[0] || 'Chennai'}</p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px' }}>PARTIES</div>

                        <div style={{ marginBottom: '15px' }}>
                            <p><strong>CONTRACTOR:</strong></p>
                            <p><strong>M/s. ELANJAI BUILDOS</strong></p>
                            <p>A proprietor firm, represented by Mr. P. Sathish Kumar (son of Mr. V. Pachiyappan)</p>
                            <p>Age: 39 years</p>
                            <p>Office: No.19, Pillayar Kovil Street, Old Pallavaram, Chennai - 600117</p>
                        </div>

                        <div>
                            <p><strong>OWNER:</strong></p>
                            <p><strong>{quotation.clientName}</strong></p>
                            <p>Mobile: {quotation.mobileNumber}</p>
                            <p>Address: {quotation.location}</p>
                        </div>
                    </div>

                    <p style={{ marginBottom: '15px', textAlign: 'justify' }}>
                        The expressions 'CONTRACTOR' and 'OWNERS' shall, unless repugnant to the context or meaning thereof, be deemed to include their respective heirs, legal representatives, executors and administrators and assigns.
                    </p>

                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>RECITALS</div>
                    <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
                        WHEREAS the OWNERS is the Owner-in-possession of the property bearing {quotation.location}.
                    </p>
                    <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
                        AND WHEREAS the OWNERS is desirous of getting a residential building constructed on the said plot of land.
                    </p>
                    <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
                        AND WHEREAS the said Mr P. Sathish Kumar, being a CONTRACTOR carrying his business in the name of M/s. ELANJAI BUILDOS, has agreed to construct a residential building on the said plot of land for the owner.
                    </p>
                    <p style={{ marginBottom: '20px', textAlign: 'justify' }}>
                        AND WHEREAS in consideration of the premises hereinbefore recited and in further consideration of the advantages and obligations accorded and undertaken by the parties hereto, it is agreed to put the same in writing.
                    </p>

                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>TERMS</div>
                    <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
                        The Construction will be started from the date and finish {Math.ceil(stagesConfig.totalDays / 30)} MONTHS ({stagesConfig.totalDays} Days) for the agreement period.
                    </p>
                    <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
                        In case of dispute or difference arising out of this agreement or touching upon this Agreement between the parties hereto during the progress of or after construction of the building, then and in such an event the same shall be referred to Arbitration under Arbitration and Conciliation Act, 1996 or and statutory modifications or re-enactment thereof and rules made thereunder.
                    </p>
                    <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
                        The Courts at Chennai will have jurisdiction in respect of matters covered under this agreement.
                    </p>
                    <p style={{ marginBottom: '20px', textAlign: 'justify' }}>
                        This Agreement original shall be retained by the OWNER and the duplicate similarly executed shall be retained by the CONTRACTOR.
                    </p>

                    {/* SCHEDULE A */}
                    <div style={{ fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>SCHEDULE - A (Measurements)</div>
                    <p>To be constructed for a New Residential Building for a Material Contractor:</p>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', marginBottom: '20px' }}>
                        <tbody>
                            <tr>
                                <td style={{ border: 'none', padding: '5px' }}>Built-up Area:</td>
                                <td style={{ border: 'none', padding: '5px', fontWeight: 'bold' }}>{quotation.sqft} sq.ft</td>
                            </tr>
                            <tr>
                                <td style={{ border: 'none', padding: '5px' }}>Rate per sq.ft:</td>
                                <td style={{ border: 'none', padding: '5px' }}>{formatCurrency(quotation.baseRatePerSqft)} / sq.ft</td>
                            </tr>
                            <tr>
                                <td style={{ border: 'none', padding: '5px' }}>Package Type:</td>
                                <td style={{ border: 'none', padding: '5px' }}>{quotation.selectedPackage?.toUpperCase() || '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* SCHEDULE B */}
                    <div style={{ fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>SCHEDULE - B (Specifications)</div>

                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>1. Basement & Concrete works</div>
                        {specs.basement.map((item, i) => (
                            <div key={i} style={{ paddingLeft: '20px' }}>{String.fromCharCode(97 + i)}) {item}</div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>2. Brick Work</div>
                        {specs.brickWork.map((item, i) => (
                            <div key={i} style={{ paddingLeft: '20px' }}>{String.fromCharCode(97 + i)}) {item}</div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>3. Plastering</div>
                        {specs.plastering.map((item, i) => (
                            <div key={i} style={{ paddingLeft: '20px' }}>{String.fromCharCode(97 + i)}) {item}</div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>4. Flooring & tiles</div>
                        {specs.flooring.map((item, i) => (
                            <div key={i} style={{ paddingLeft: '20px' }}>{String.fromCharCode(97 + i)}) {item}</div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>5. Carpentry & Joinery</div>
                        {specs.joinery.map((item, i) => (
                            <div key={i} style={{ paddingLeft: '20px' }}>{String.fromCharCode(97 + i)}) {item}</div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>6. Painting</div>
                        {specs.painting.map((item, i) => (
                            <div key={i} style={{ paddingLeft: '20px' }}>{String.fromCharCode(97 + i)}) {item}</div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>7. Electrical</div>
                        {specs.electrical.map((item, i) => (
                            <div key={i} style={{ paddingLeft: '20px' }}>{String.fromCharCode(97 + i)}) {item}</div>
                        ))}

                        {/* Electrical Provisions Table from Sample */}
                        <div style={{ marginTop: '10px', fontSize: '10pt' }}>
                            <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>ELECTRICAL PROVISIONS:</div>
                            <div style={{ marginTop: '5px' }}><strong>Hall:</strong> Light - 4 nos, Fan - 2 nos, 5amps Socket - 5 nos, Ceiling Spot lights - 4 nos, AC provision</div>
                            <div><strong>Kitchen:</strong> Light - 2 nos, Fan - 1 no, 5amps Socket - 1 no, 15amps Socket - 3 no, Exhaust Provision</div>
                            <div><strong>Bedrooms:</strong> Light - 2 nos, Fan - 1 no, 5amps Socket - 2 nos, AC provision, TV - 1 no, Foot Lamp - 1no</div>
                            <div><strong>Toilet:</strong> Light - 1 no, Exhaust, Geyser, 5amps Socket - 1 nos</div>
                            <div><strong>Parking:</strong> Wet/Dry area suitable lights & Sockets (EV Charger)</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>8. Plumbing</div>
                        {specs.plumbing.map((item, i) => (
                            <div key={i} style={{ paddingLeft: '20px' }}>{String.fromCharCode(97 + i)}) {item}</div>
                        ))}
                    </div>

                    {/* SCHEDULE C */}
                    <div style={{ fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>SCHEDULE - C (Materials to be used)</div>
                    <p style={{ marginBottom: '10px' }}>The Brand Name of the items are as follows:</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr><td>Cement</td><td>Coromandel Dalmia, Equivalent Wherever necessary</td></tr>
                            <tr><td>Bricks</td><td>Red bricks</td></tr>
                            <tr><td>Steel</td><td>ISI branded steel</td></tr>
                            <tr><td>Exterior Paint</td><td>Asian Paint</td></tr>
                            <tr><td>Interior Paint</td><td>Asian paint</td></tr>
                            <tr><td>Switches</td><td>Orbit</td></tr>
                            <tr><td>Ceramic Tiles</td><td>KAG</td></tr>
                            <tr><td>Wash basin</td><td>Parryware</td></tr>
                            <tr><td>Bathroom fittings</td><td>Parryware, Hindware continental Brand or equivalent</td></tr>
                            <tr><td>Wires</td><td>Orbit or equivalent Brand</td></tr>
                        </tbody>
                    </table>

                    {/* SCHEDULE D */}
                    <div style={{ fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>SCHEDULE - D (Extra Work)</div>
                    <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '5px' }}>EXTRA WORK (ADDITIONAL COSTS)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '10pt' }}>
                        <div>A) DRAWING & APPROVAL</div>
                        <div>I) WEATHERING TILES (Rs. 140/sq.ft)</div>
                        <div>B) ELEVATION</div>
                        <div>J) E.B CONNECTION</div>
                        <div>C) LIFT</div>
                        <div>K) ELECTRICAL FITTINGS</div>
                        <div>D) SUMP (R.C.C Rs.25/ liter)</div>
                        <div>L) INTERIOR</div>
                        <div>E) SEPTIC TANK (BRICK WORK Rs.20/ liters)</div>
                        <div>M) PARAPET WALL 9" (Rs.150/Rft)</div>
                        <div>F) OHT (R.C.C Rs.25/ liter)</div>
                        <div>N) CHOKE PITS, DRAINAGE, ETC.</div>
                        <div>G) COMPOUND WALL (Rs.2000/ RFT)</div>
                        <div>O) WATER PURCHASE FROM OUTSIDE</div>
                        <div>H) BORE WELL</div>
                        <div>P) GST ADDITIONAL FROM THIS QUOTE</div>
                    </div>


                    {/* SCHEDULE E */}
                    <div style={{ fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>SCHEDULE - E (Estimate And Costing)</div>
                    <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px' }}>QUOTATION FOR RESIDENTIAL HOUSE CONSTRUCTION</div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #000', padding: '5px' }}>S.No</th>
                                <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Description</th>
                                <th style={{ border: '1px solid #000', padding: '5px' }}>Area</th>
                                <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>Rate/SFT</th>
                                <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>1</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{quotation.buildingType.replace('_', ' ').toUpperCase()} Construction</td>
                                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{quotation.sqft}</td>
                                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{quotation.baseRatePerSqft}</td>
                                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(totalCost)}</td>
                            </tr>
                            {/* Placeholder for extras if we had them broken down */}
                            <tr style={{ fontWeight: 'bold' }}>
                                <td colSpan={4} style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>ToTal Contract Amount</td>
                                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(totalCost)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px' }}>STAGEWISE PAYMENT</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #000', padding: '5px' }}>SI.NO</th>
                                <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Stage</th>
                                <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>%</th>
                                <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Advance Payment */}
                            <tr>
                                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>1</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>Advance upon Agreement Signing</td>
                                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{stagesConfig.advancePercentage}%</td>
                                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>
                                    {formatCurrency((stagesConfig.advancePercentage / 100) * totalCost)}
                                </td>
                            </tr>

                            {/* Construction Stages */}
                            {stagesConfig.stages.map((stage, idx) => (
                                <tr key={stage.stageId}>
                                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 2}</td>
                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{stage.name}</td>
                                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{stage.costPercentage}%</td>
                                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(stage.amount)}</td>
                                </tr>
                            ))}

                            {/* Retention Payment if any */}
                            {stagesConfig.retentionPercentage > 0 && (
                                <tr>
                                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{stagesConfig.stages.length + 2}</td>
                                    <td style={{ border: '1px solid #000', padding: '5px' }}>Retention / Handover</td>
                                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{stagesConfig.retentionPercentage}%</td>
                                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>
                                        {formatCurrency((stagesConfig.retentionPercentage / 100) * totalCost)}
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </table>

                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>ADDITIONAL NOTES</div>
                    <ul style={{ paddingLeft: '20px', marginBottom: '20px', listStyleType: 'disc' }}>
                        <li>The Construction work with good quality and quantity will finish on time.</li>
                        <li>As per Drawing and Specifications work will be finished, in case any changes and extra work will be asked, extra charges for the work will be given.</li>
                    </ul>

                    <div style={{ marginTop: '60px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '20px' }}>SIGNATURES</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ textAlign: 'center', width: '200px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>OWNER</div>
                                <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
                                    (Signature)
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', width: '200px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>CONTRACTOR</div>
                                <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
                                    For ELANJAI BUILDOS
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '40px' }}>
                            <div style={{ fontWeight: 'bold' }}>WITNESS:</div>
                            <div style={{ marginTop: '20px', borderBottom: '1px solid #000', width: '200px' }}></div>
                        </div>
                    </div>

                </div>
            </Card>

            <div className="mt-8 text-center text-gray-500 text-sm no-print">
                Review the agreement carefully before printing. Use the "Print / Download PDF" button to save as PDF.
            </div>
        </div>
    )
}
